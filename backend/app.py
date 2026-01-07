from flask import Flask, jsonify, request
from flask_cors import CORS
import polars as pl
import os
from datetime import datetime
from compute import compute_emission

app = Flask(__name__)
CORS(app)

# Path to data directory
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'Data')

def load_reports():
    """Load CSV reports as Polars DataFrames"""
    try:
        final_report = pl.read_csv(os.path.join(DATA_DIR, 'final_report.csv'))
        detailed_report = pl.read_csv(os.path.join(DATA_DIR, 'detailed_report.csv'))
        return final_report, detailed_report
    except Exception as e:
        print(f"Error loading reports: {e}")
        return None, None

def df_to_dict(df):
    """Convert Polars DataFrame to list of dicts"""
    if df is None:
        return []
    return df.to_dicts()

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/summary', methods=['GET'])
def get_summary():
    """Get overall CO2 emissions summary"""
    final_report, _ = load_reports()
    if final_report is None:
        return jsonify({'error': 'Reports not available'}), 500
    
    # Get CO2 columns
    co2_cols = [col for col in final_report.columns if col.startswith('CO2 ')]
    
    # Calculate totals
    try:
        total_co2 = sum([final_report[col].sum() for col in co2_cols]) if co2_cols else 0
        total_units = final_report['Units'].sum() if 'Units' in final_report.columns else 0
        total_kg = final_report['KG'].sum() if 'KG' in final_report.columns else 0
    except:
        total_co2 = total_units = total_kg = 0
    
    co2_by_mode = {}
    for mode in ['Road', 'Rail', 'Sea', 'Air']:
        col_name = f'CO2 {mode}'
        if col_name in final_report.columns:
            co2_by_mode[mode] = float(final_report[col_name].sum())
    
    total_orders = len(final_report) if 'Order Number' in final_report.columns else 0
    
    return jsonify({
        'total_co2': float(total_co2),
        'total_units': float(total_units),
        'total_kg': float(total_kg),
        'total_orders': total_orders,
        'co2_by_mode': co2_by_mode
    })

@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Get paginated orders"""
    final_report, _ = load_reports()
    if final_report is None:
        return jsonify({'error': 'Reports not available'}), 500
    
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    
    total = len(final_report)
    start = (page - 1) * per_page
    end = start + per_page
    
    paginated = final_report[start:end]
    
    return jsonify({
        'orders': df_to_dict(paginated),
        'total': total,
        'page': page,
        'per_page': per_page
    })

@app.route('/api/orders/<order_number>', methods=['GET'])
def get_order_detail(order_number):
    """Get detailed view of a specific order"""
    _, detailed_report = load_reports()
    if detailed_report is None:
        return jsonify({'error': 'Reports not available'}), 500
    
    try:
        order_lines = detailed_report.filter(
            pl.col('Order Number') == order_number
        )
    except:
        return jsonify({'error': 'Order not found'}), 404
    
    if len(order_lines) == 0:
        return jsonify({'error': 'Order not found'}), 404
    
    return jsonify(df_to_dict(order_lines))

@app.route('/api/analytics/by-warehouse', methods=['GET'])
def get_analytics_warehouse():
    """CO2 emissions by warehouse"""
    final_report, _ = load_reports()
    if final_report is None:
        return jsonify({'error': 'Reports not available'}), 500
    
    warehouse_data = []
    
    try:
        warehouses = final_report['Warehouse Code'].unique()
        
        for warehouse in warehouses:
            if warehouse is None:
                continue
            
            wh_df = final_report.filter(pl.col('Warehouse Code') == warehouse)
            
            co2_by_mode = {}
            for mode in ['Road', 'Rail', 'Sea', 'Air']:
                col_name = f'CO2 {mode}'
                if col_name in wh_df.columns:
                    co2_by_mode[mode] = float(wh_df[col_name].sum())
            
            co2_cols = [col for col in wh_df.columns if col.startswith('CO2 ')]
            total_co2 = sum([wh_df[col].sum() for col in co2_cols]) if co2_cols else 0
            
            warehouse_data.append({
                'warehouse_code': str(warehouse),
                'warehouse_name': str(wh_df['Warehouse Name'][0]) if 'Warehouse Name' in wh_df.columns else '',
                'total_co2': float(total_co2),
                'total_kg': float(wh_df['KG'].sum()) if 'KG' in wh_df.columns else 0,
                'co2_by_mode': co2_by_mode
            })
    except Exception as e:
        print(f"Error in by-warehouse: {e}")
    
    return jsonify(warehouse_data)

@app.route('/api/analytics/by-customer', methods=['GET'])
def get_analytics_customer():
    """CO2 emissions by customer"""
    final_report, _ = load_reports()
    if final_report is None:
        return jsonify({'error': 'Reports not available'}), 500
    
    customer_data = []
    
    try:
        customers = final_report['Customer Code'].unique()
        
        for customer in customers:
            if customer is None:
                continue
            
            cust_df = final_report.filter(pl.col('Customer Code') == customer)
            
            co2_by_mode = {}
            for mode in ['Road', 'Rail', 'Sea', 'Air']:
                col_name = f'CO2 {mode}'
                if col_name in cust_df.columns:
                    co2_by_mode[mode] = float(cust_df[col_name].sum())
            
            co2_cols = [col for col in cust_df.columns if col.startswith('CO2 ')]
            total_co2 = sum([cust_df[col].sum() for col in co2_cols]) if co2_cols else 0
            
            customer_data.append({
                'customer_code': str(customer),
                'customer_country': str(cust_df['Customer Country'][0]) if 'Customer Country' in cust_df.columns else '',
                'customer_city': str(cust_df['Customer City'][0]) if 'Customer City' in cust_df.columns else '',
                'total_co2': float(total_co2),
                'total_kg': float(cust_df['KG'].sum()) if 'KG' in cust_df.columns else 0,
                'co2_by_mode': co2_by_mode
            })
    except Exception as e:
        print(f"Error in by-customer: {e}")
    
    return jsonify(customer_data)

@app.route('/api/analytics/by-mode', methods=['GET'])
def get_analytics_mode():
    """CO2 emissions by transport mode"""
    final_report, _ = load_reports()
    if final_report is None:
        return jsonify({'error': 'Reports not available'}), 500
    
    mode_data = {}
    
    try:
        for mode in ['Road', 'Rail', 'Sea', 'Air']:
            col_name = f'CO2 {mode}'
            if col_name in final_report.columns:
                mode_df = final_report.filter(pl.col(mode) > 0) if mode in final_report.columns else final_report
                
                mode_data[mode] = {
                    'total_co2': float(final_report[col_name].sum()),
                    'order_count': len(mode_df),
                    'avg_distance': float(mode_df[mode].mean()) if mode in mode_df.columns else 0
                }
    except Exception as e:
        print(f"Error in by-mode: {e}")
    
    return jsonify(mode_data)

@app.route('/api/analytics/by-month', methods=['GET'])
def get_analytics_month():
    """CO2 emissions by month"""
    final_report, _ = load_reports()
    if final_report is None:
        return jsonify({'error': 'Reports not available'}), 500
    
    month_data = []
    
    try:
        if 'Month-Year' in final_report.columns:
            months = final_report['Month-Year'].unique().sort()
            
            for month in months:
                if month is None:
                    continue
                
                month_df = final_report.filter(pl.col('Month-Year') == month)
                
                co2_by_mode = {}
                for mode in ['Road', 'Rail', 'Sea', 'Air']:
                    col_name = f'CO2 {mode}'
                    if col_name in month_df.columns:
                        co2_by_mode[mode] = float(month_df[col_name].sum())
                
                co2_cols = [col for col in month_df.columns if col.startswith('CO2 ')]
                total_co2 = sum([month_df[col].sum() for col in co2_cols]) if co2_cols else 0
                
                month_data.append({
                    'month': str(month),
                    'total_co2': float(total_co2),
                    'co2_by_mode': co2_by_mode
                })
    except Exception as e:
        print(f"Error in by-month: {e}")
    
    return jsonify(month_data)


@app.route('/api/compute-emission', methods=['POST'])
def compute_emission_endpoint():
    """Compute emissions for ad-hoc input payload"""
    payload = request.get_json()
    if not payload:
        return jsonify({'error': 'Invalid JSON payload'}), 400

    try:
        result = compute_emission(payload)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
