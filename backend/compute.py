import os
import polars as pl

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'Data')

dict_co2e = {'Air': 2.1, 'Sea': 0.01, 'Road': 0.096, 'Rail': 0.028}


def _load_uom_map():
    path = os.path.join(DATA_DIR, 'uom_conversions.csv')
    df = pl.read_csv(path)
    # find columns that represent item code and conversion ratio
    item_col = next((c for c in df.columns if 'Item' in c), None)
    conv_col = next((c for c in df.columns if 'Conversion' in c), None)
    if item_col is None or conv_col is None:
        raise RuntimeError('uom_conversions.csv missing expected columns')
    # use dicts to avoid tuple-indexing issues
    m = {}
    for r in df.to_dicts():
        key = r.get(item_col)
        val = r.get(conv_col)
        if key is None:
            continue
        try:
            m[str(key)] = float(val)
        except Exception:
            m[str(key)] = float(1.0)
    return m


def _load_distance_row(warehouse_code, customer_code):
    path = os.path.join(DATA_DIR, 'distances.csv')
    df = pl.read_csv(path)
    # attempt to find the matching row by codes
    try:
        # cast codes to string for robust matching regardless of CSV types
        row = df.filter((pl.col('Warehouse Code').cast(pl.Utf8) == str(warehouse_code)) & (pl.col('Customer Code').cast(pl.Utf8) == str(customer_code)))
        if len(row) == 0:
            return None
        r = row.to_dicts()[0]
        # build distance dict from named dict
        dist = {}
        for mode in ['Road', 'Rail', 'Sea', 'Air']:
            try:
                dist[mode] = float(r.get(mode, 0.0) or 0.0)
            except Exception:
                dist[mode] = 0.0
        return dist
    except Exception:
        return None


def compute_emission(payload: dict) -> dict:
    """Compute emissions for a given payload.

    payload keys:
      - warehouse_code, customer_code
      - items: list of {"Item Code": str, "Units": number}
      - distance_km: optional numeric override
      - mode: optional 'auto' or one of modes

    Returns dict with total_kg, co2_by_mode, total_co2 and warnings
    """
    warnings = []
    items = payload.get('items', []) or []
    warehouse = payload.get('warehouse_code')
    customer = payload.get('customer_code')
    distance_override = payload.get('distance_km')
    mode = payload.get('mode', 'auto')

    uom_map = _load_uom_map()

    total_kg = 0.0
    for it in items:
        code = str(it.get('Item Code') or it.get('ItemCode') or '')
        units = float(it.get('Units', 0) or 0)
        conv = uom_map.get(code)
        if conv is None:
            warnings.append(f'No conversion ratio for Item Code {code}; assuming 1')
            conv = 1.0
        total_kg += units * conv

    # determine distances
    # priority: explicit payload.distances -> lookup by warehouse/customer -> single override
    distances = None
    payload_distances = payload.get('distances')
    if payload_distances and isinstance(payload_distances, dict):
        # normalize keys and ensure numeric values
        distances = {m: float(payload_distances.get(m, 0.0) or 0.0) for m in dict_co2e.keys()}
    else:
        if warehouse and customer:
            distances = _load_distance_row(warehouse, customer)

        if distances is None:
            # if we don't have a lookup, but an override is provided
            if distance_override is not None:
                d = float(distance_override)
                if mode != 'auto' and mode in dict_co2e:
                    distances = {m: 0.0 for m in dict_co2e}
                    distances[mode] = d
                else:
                    distances = {m: d for m in dict_co2e}
            else:
                # no distances available
                distances = {m: 0.0 for m in dict_co2e}
                warnings.append('No distance found for warehouse/customer and no override provided')

    # compute CO2 per mode
    co2_by_mode = {}
    total_co2 = 0.0
    for m, factor in dict_co2e.items():
        dist_km = float(distances.get(m, 0.0) or 0.0)
        co2 = (total_kg / 1000.0) * dist_km * factor
        co2_by_mode[m] = round(co2, 6)
        total_co2 += co2

    result = {
        'total_kg': round(total_kg, 6),
        'co2_by_mode': co2_by_mode,
        'total_co2': round(total_co2, 6),
        'warnings': warnings,
    }
    return result
