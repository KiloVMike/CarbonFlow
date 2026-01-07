import polars as pl
import os
os.chdir(r'E:\1st SEM\DSA\projects\supply-chain-sustainability-main')
lines=pl.read_csv('Data/order_lines.csv')
dist=pl.read_csv('Data/distances.csv')
order_codes=set(lines['Customer Code'].unique().to_list())
dist_codes=set(dist['Customer Code'].unique().to_list())
missing=sorted(list(order_codes - dist_codes))
print('Missing in distances:', missing)
extra=sorted(list(dist_codes - order_codes))
print('Extra in distances:', extra)
print('Total orders:', len(order_codes), 'Total distances rows:', len(dist_codes))
