"""
regenerate_reports.py
Reads Data CSVs and recreates Data/detailed_report.csv and Data/final_report.csv using Polars.
"""
import os
import polars as pl
from datetime import datetime

ROOT = os.path.dirname(__file__)
DATA_DIR = os.path.join(ROOT, 'Data')

def read_csv(name):
    path = os.path.join(DATA_DIR, name)
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    return pl.read_csv(path)


def main():
    print('Loading CSVs from', DATA_DIR)
    df_lines = read_csv('order_lines.csv')
    print(f'Order lines: {len(df_lines)}')
    df_uom = read_csv('uom_conversions.csv')
    print(f'UOM rows: {len(df_uom)}')
    df_dist = read_csv('distances.csv')
    print(f'Distances rows: {len(df_dist)}')
    df_gps = read_csv('gps_locations.csv')
    print(f'GPS rows: {len(df_gps)}')

    # Prepare distance Location if present
    if 'Customer Country' in df_dist.columns and 'Customer City' in df_dist.columns:
        df_dist = df_dist.with_columns([
            (pl.col('Customer Country').cast(pl.Utf8) + ', ' + pl.col('Customer City').cast(pl.Utf8)).alias('Location')
        ])

    # Merge UOM
    df_join = df_lines.join(df_uom, on='Item Code', how='left')
    print('After UOM join:', len(df_join))

    # Merge distances with gps
    if 'Location' in df_dist.columns and 'Location' in df_gps.columns:
        df_dist = df_dist.join(df_gps, on='Location', how='left')

    # Final join on Warehouse Code + Customer Code
    join_cols = [c for c in ['Warehouse Code', 'Customer Code'] if c in df_join.columns]
    if not join_cols:
        raise RuntimeError('Expected join keys not found')

    df_join = df_join.join(df_dist, on=join_cols, how='left')
    print('After final joins:', len(df_join))

    # Ensure numeric columns
    for col in ['Units', 'Conversion Ratio']:
        if col in df_join.columns:
            df_join = df_join.with_columns([pl.col(col).cast(pl.Float64)])

    # Calculate KG per line
    if 'Units' in df_join.columns and 'Conversion Ratio' in df_join.columns:
        df_join = df_join.with_columns([(pl.col('Units') * pl.col('Conversion Ratio')).alias('KG')])
    else:
        df_join = df_join.with_columns([pl.lit(0.0).alias('KG')])

    # Modes and emission factors
    MODES = ['Road', 'Rail', 'Sea', 'Air']
    dict_co2e = {'Air': 2.1, 'Sea': 0.01, 'Road': 0.096, 'Rail': 0.028}

    # Ensure mode distance columns present and numeric
    for m in MODES:
        if m not in df_join.columns:
            df_join = df_join.with_columns([pl.lit(0.0).alias(m)])
        df_join = df_join.with_columns([pl.col(m).cast(pl.Float64)])

    # Compute CO2 per line
    for m in MODES:
        co2_col = f'CO2 {m}'
        df_join = df_join.with_columns([((pl.col('KG') / 1000.0) * pl.col(m) * dict_co2e[m]).alias(co2_col)])

    # Total CO2 per line
    co2_cols = [f'CO2 {m}' for m in MODES]
    # sum expressions with a pl.lit(0) start to ensure Expr addition works
    df_join = df_join.with_columns([sum([pl.col(c) for c in co2_cols], pl.lit(0)).alias('CO2 Total')])

    # Parse `Location` (expected 'COUNTRY, CITY') to extract possible city/country values
    if 'Location' in df_join.columns:
        # use regex extract to avoid list dtypes from split
        loc_re = r"^\s*([^,]+)\s*(?:,\s*(.*))?$"
        df_join = df_join.with_columns([
            pl.col('Location').str.extract(loc_re, 1).alias('_parsed_country'),
            pl.col('Location').str.extract(loc_re, 2).alias('_parsed_city')
        ])

        # Fill missing Customer City/Country from parsed values when available
        if 'Customer City' in df_join.columns:
            df_join = df_join.with_columns([
                pl.when(pl.col('Customer City').is_null() | (pl.col('Customer City') == '')).then(pl.col('_parsed_city')).otherwise(pl.col('Customer City')).alias('Customer City')
            ])
        if 'Customer Country' in df_join.columns:
            df_join = df_join.with_columns([
                pl.when(pl.col('Customer Country').is_null() | (pl.col('Customer Country') == '')).then(pl.col('_parsed_country')).otherwise(pl.col('Customer Country')).alias('Customer Country')
            ])


    # Normalize — replace nulls with sensible defaults before saving
    num_cols = [c for c in ['Units', 'KG'] + MODES + co2_cols + ['CO2 Total'] if c in df_join.columns]
    str_cols = [c for c in ['Warehouse Name', 'Warehouse Country', 'Warehouse City', 'Customer Country', 'Customer City', 'Location', 'Order Number', 'Item Code'] if c in df_join.columns]
    gps_cols = [c for c in ['GPS 1', 'GPS 2'] if c in df_join.columns]

    fill_exprs = []
    for c in num_cols:
        fill_exprs.append(pl.col(c).fill_null(0).alias(c))
    for c in gps_cols:
        fill_exprs.append(pl.col(c).fill_null(0.0).alias(c))
    for c in str_cols:
        fill_exprs.append(pl.col(c).fill_null('Unknown').alias(c))

    if fill_exprs:
        df_join = df_join.with_columns(fill_exprs)

    # drop helper parsed cols if present
    if '_parsed_country' in df_join.columns:
        df_join = df_join.drop(['_parsed_country', '_parsed_city'])

    # Save detailed report
    detailed_path = os.path.join(DATA_DIR, 'detailed_report.csv')
    df_join.write_csv(detailed_path)
    print('Saved', detailed_path)

    # Aggregate to order level
    cols = df_join.columns
    print('Columns count:', len(cols))
    # show duplicates if any
    from collections import Counter
    cnt = Counter(cols)
    dup_to_drop = [k for k, v in cnt.items() if v > 1]
    if dup_to_drop:
        print('Found duplicate column names (will drop extras):', dup_to_drop)
        # drop all duplicate columns except the first occurrence
        to_remove = []
        seen = set()
        for c in cols:
            if c in seen:
                to_remove.append(c)
            else:
                seen.add(c)
        print('Dropping columns:', to_remove)
        df_join = df_join.drop(to_remove)
    else:
        print('No duplicate column names found')

    gpby = [c for c in [
        'Date', 'Month-Year', 'Warehouse Code', 'Warehouse Name', 'Warehouse Country', 'Warehouse City',
        'Customer Code', 'Customer Country', 'Customer City', 'Location', 'GPS 1', 'GPS 2',
        'Road', 'Rail', 'Sea', 'Air', 'Order Number'
    ] if c in df_join.columns]

    # Use first() for non-aggregated columns like delivery locations; avoid re-aggregating
    agg_exprs = [pl.col('Units').sum().alias('Units'), pl.col('KG').sum().alias('KG')]
    for m in MODES:
        # only aggregate mode distances if they are NOT part of the group-by keys
        if m in df_join.columns and m not in gpby:
            agg_exprs.append(pl.col(m).first().alias(m))
    # Sum CO2 mode columns
    for c in co2_cols:
        if c in df_join.columns:
            agg_exprs.append(pl.col(c).sum().alias(c))
    agg_exprs.append(pl.col('CO2 Total').sum().alias('CO2 Total'))

    df_agg = df_join.groupby(gpby).agg(agg_exprs)

    # If Delivery Mode mapping needed: compute which modes used
    def build_delivery_mode(df):
        # fallback: build a comma-separated string of modes with distance>0
        parts = []
        for m in MODES:
            if m in df.columns:
                if float(df[m]) > 0:
                    parts.append(m)
        return ','.join(parts)

    # Add Delivery Mode column by mapping first row's distances
    # Build a small DataFrame to compute delivery mode per group
    if len(df_agg) > 0:
        df_agg = df_agg.with_columns([pl.when(pl.col(m) > 0).then(pl.lit(m)).otherwise(pl.lit('')).alias(f'_use_{m}') for m in MODES])
        # join pieces into Delivery Mode
        df_agg = df_agg.with_columns([(pl.concat_str([pl.col(f'_use_{m}') for m in MODES], separator=',')).alias('Delivery Mode')])
        # cleanup helper cols
        for m in MODES:
            df_agg = df_agg.drop(f'_use_{m}')

    # For aggregated data, try to fill missing customer city/country from Location
    if 'Location' in df_agg.columns:
        loc_re = r"^\s*([^,]+)\s*(?:,\s*(.*))?$"
        df_agg = df_agg.with_columns([
            pl.col('Location').str.extract(loc_re, 1).alias('_parsed_country'),
            pl.col('Location').str.extract(loc_re, 2).alias('_parsed_city')
        ])
        if 'Customer City' in df_agg.columns:
            df_agg = df_agg.with_columns([
                pl.when(pl.col('Customer City').is_null() | (pl.col('Customer City') == '')).then(pl.col('_parsed_city')).otherwise(pl.col('Customer City')).alias('Customer City')
            ])
        if 'Customer Country' in df_agg.columns:
            df_agg = df_agg.with_columns([
                pl.when(pl.col('Customer Country').is_null() | (pl.col('Customer Country') == '')).then(pl.col('_parsed_country')).otherwise(pl.col('Customer Country')).alias('Customer Country')
            ])
        df_agg = df_agg.drop(['_parsed_country', '_parsed_city'])

    # Save final report
    final_path = os.path.join(DATA_DIR, 'final_report.csv')
    # normalize aggregated dataframe as well
    agg_num_cols = [c for c in ['Units', 'KG'] + MODES + co2_cols + ['CO2 Total'] if c in df_agg.columns]
    agg_str_cols = [c for c in ['Warehouse Name', 'Warehouse Country', 'Warehouse City', 'Customer Country', 'Customer City', 'Location', 'Order Number'] if c in df_agg.columns]
    agg_gps_cols = [c for c in ['GPS 1', 'GPS 2'] if c in df_agg.columns]

    agg_fill_exprs = []
    for c in agg_num_cols:
        agg_fill_exprs.append(pl.col(c).fill_null(0).alias(c))
    for c in agg_gps_cols:
        agg_fill_exprs.append(pl.col(c).fill_null(0.0).alias(c))
    for c in agg_str_cols:
        agg_fill_exprs.append(pl.col(c).fill_null('Unknown').alias(c))

    if agg_fill_exprs:
        df_agg = df_agg.with_columns(agg_fill_exprs)

    df_agg.write_csv(final_path)
    print('Saved', final_path)

    # Print summary
    total_co2 = 0.0
    for c in co2_cols:
        if c in df_agg.columns:
            try:
                total_co2 += float(df_agg[c].sum())
            except:
                pass
    print(f'Total orders: {len(df_agg)}')
    print(f'Total CO2 (kg): {total_co2:.2f}')

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print('Error:', e)
        raise
