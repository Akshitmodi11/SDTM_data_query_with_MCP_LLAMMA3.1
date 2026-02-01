import pandas as pd
import os

print("🏥 Converting XPT files to CSV...\n")

# List of files to convert
files_to_convert = ['AE', 'DM', 'LB', 'VS', 'CM', 'MH']

for file_name in files_to_convert:
    xpt_file = f'xptfiles/{file_name}.xpt'
    csv_file = f'{file_name.lower()}.csv'
    
    try:
        print(f"Converting {file_name}.xpt...")
        
        # Read XPT file
        df = pd.read_sas(xpt_file, format='xport')
        
        # Save as CSV
        df.to_csv(csv_file, index=False)
        
        print(f"  ✅ Saved to {csv_file}")
        print(f"  Rows: {len(df):,}")
        print(f"  Columns: {len(df.columns)}")
        print()
        
    except Exception as e:
        print(f"  ❌ Error: {e}\n")

print("🎉 Done! CSV files are ready.")
