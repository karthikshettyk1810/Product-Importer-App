#!/usr/bin/env python3
"""
Generate large CSV files for testing performance
"""
import csv
import sys
from datetime import datetime

def generate_csv(filename, num_records):
    """Generate a CSV file with specified number of records"""
    print(f"Generating {num_records:,} records...")
    start_time = datetime.now()
    
    with open(filename, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        
        # Write header
        writer.writerow(['sku', 'name', 'description', 'price'])
        
        # Write records
        for i in range(num_records):
            sku = f'SKU{i:07d}'
            name = f'Product {i}'
            description = f'Description for product {i} with some additional text to make it realistic'
            price = f'{10 + (i % 1000) * 0.99:.2f}'
            
            writer.writerow([sku, name, description, price])
            
            # Progress indicator
            if (i + 1) % 10000 == 0:
                print(f'  Generated {i + 1:,} records...')
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    print(f"\n✅ Generated {num_records:,} records in {duration:.2f} seconds")
    print(f"📁 File: {filename}")
    print(f"💾 Size: {get_file_size(filename)}")

def get_file_size(filename):
    """Get human-readable file size"""
    import os
    size = os.path.getsize(filename)
    
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size < 1024.0:
            return f"{size:.2f} {unit}"
        size /= 1024.0
    return f"{size:.2f} TB"

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python generate_test_csv.py <num_records>")
        print("\nExamples:")
        print("  python generate_test_csv.py 1000      # 1k records")
        print("  python generate_test_csv.py 10000     # 10k records")
        print("  python generate_test_csv.py 100000    # 100k records")
        print("  python generate_test_csv.py 500000    # 500k records")
        sys.exit(1)
    
    try:
        num_records = int(sys.argv[1])
        if num_records <= 0:
            raise ValueError("Number of records must be positive")
        
        filename = f'test_products_{num_records}.csv'
        generate_csv(filename, num_records)
        
        print("\n📊 Test this file:")
        print(f"  1. Upload {filename} via the UI")
        print(f"  2. Watch the progress bar")
        print(f"  3. Check Celery worker logs")
        print(f"  4. Verify all {num_records:,} products imported")
        
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
