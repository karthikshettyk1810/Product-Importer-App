# Testing Guide

Complete guide to test all features of the Product Importer application.

## Prerequisites

Make sure the application is running:

- Django server: http://localhost:8000
- Celery worker: Running in separate terminal
- Redis: Running and accessible

## Test 1: CSV Upload with Progress Tracking

### Steps:

1. Navigate to http://localhost:8000/
2. Click "Choose File" and select `sample_products.csv`
3. Click "Upload CSV"

### Expected Results:

- ✅ Progress bar appears immediately
- ✅ Progress updates in real-time (0% → 100%)
- ✅ Status messages change: "Parsing CSV..." → "Validating..." → "Importing..." → "Completed"
- ✅ Success message appears when complete
- ✅ File input is cleared

### Verify in Database:

```bash
python manage.py shell
>>> from products.models import Product
>>> Product.objects.count()
10  # Should show 10 products
>>> Product.objects.first().sku
'prod001'  # SKU should be lowercase
```

## Test 2: Large CSV Upload

### Create Large CSV:

```python
# Create a test file with 10,000 products
with open('large_test.csv', 'w') as f:
    f.write('sku,name,description,price\n')
    for i in range(10000):
        f.write(f'SKU{i:05d},Product {i},Description for product {i},{10 + i * 0.1:.2f}\n')
```

### Steps:

1. Upload the large CSV file
2. Watch progress update smoothly
3. Verify completion

### Expected Results:

- ✅ Upload completes without errors
- ✅ Progress updates regularly
- ✅ All 10,000 products imported
- ✅ UI remains responsive

## Test 3: Duplicate SKU Handling

### Steps:

1. Upload `sample_products.csv` (already uploaded in Test 1)
2. Upload it again

### Expected Results:

- ✅ Upload completes successfully
- ✅ Product count remains 10 (not 20)
- ✅ Products are updated, not duplicated
- ✅ Check updated_at timestamp changed

### Verify:

```bash
python manage.py shell
>>> from products.models import Product
>>> Product.objects.count()
10  # Still 10, not 20
```

## Test 4: Case-Insensitive SKU

### Create Test CSV:

```csv
sku,name,description,price
TEST001,Test Product 1,Description,10.00
test001,Test Product 2,Updated Description,20.00
TEST001,Test Product 3,Final Description,30.00
```

### Steps:

1. Upload the test CSV
2. Check products

### Expected Results:

- ✅ Only 1 product created (not 3)
- ✅ SKU stored as lowercase: 'test001'
- ✅ Final values used (price: 30.00)

## Test 5: Product List and Pagination

### Steps:

1. Navigate to http://localhost:8000/products/
2. Verify product list displays
3. If you have 50+ products, test pagination

### Expected Results:

- ✅ Products displayed in table
- ✅ Shows: SKU, Name, Price, Status
- ✅ Active status shown with green indicator
- ✅ Pagination controls appear if > 50 products
- ✅ Page navigation works

## Test 6: Product Filtering

### Steps:

1. On products page, enter "PROD001" in SKU filter
2. Click "Apply Filters"
3. Clear and try name filter: "Laptop"
4. Try active status filter: "Active"

### Expected Results:

- ✅ SKU filter shows matching products
- ✅ Name filter searches product names
- ✅ Status filter shows only active/inactive
- ✅ Filters can be combined
- ✅ Results update immediately

## Test 7: Create Product

### Steps:

1. Click "Create Product" button
2. Fill in form:
   - SKU: NEWPROD001
   - Name: New Test Product
   - Description: Test description
   - Price: 99.99
   - Active: Checked
3. Click "Save"

### Expected Results:

- ✅ Modal closes
- ✅ Product appears in list
- ✅ SKU converted to lowercase
- ✅ Success indication

## Test 8: Edit Product

### Steps:

1. Find a product in the list
2. Click "Edit" button
3. Change the name and price
4. Click "Save"

### Expected Results:

- ✅ Modal opens with current values
- ✅ Changes are saved
- ✅ Updated values display in list
- ✅ updated_at timestamp changes

## Test 9: Delete Product

### Steps:

1. Click "Delete" on a product
2. Confirm deletion

### Expected Results:

- ✅ Confirmation dialog appears
- ✅ Product removed from list
- ✅ Product count decreases

## Test 10: Bulk Delete

### Steps:

1. Click "Delete All Products" button
2. Read confirmation modal
3. Click "Yes, Delete All"

### Expected Results:

- ✅ Confirmation modal with warning
- ✅ All products deleted
- ✅ Success message shown
- ✅ Product list shows "No products found"

### Verify:

```bash
python manage.py shell
>>> from products.models import Product
>>> Product.objects.count()
0
```

## Test 11: Webhook Creation

### Steps:

1. Navigate to http://localhost:8000/webhooks/
2. Click "Add Webhook"
3. Fill in form:
   - URL: https://webhook.site/unique-id (get from webhook.site)
   - Event Type: product.created
   - Enabled: Checked
4. Click "Save"

### Expected Results:

- ✅ Webhook appears in list
- ✅ Shows as "Enabled"
- ✅ Event type displayed correctly

## Test 12: Webhook Testing

### Steps:

1. On webhook list, click "Test" button
2. Wait for response

### Expected Results:

- ✅ Test result modal appears
- ✅ Shows HTTP status (200)
- ✅ Shows response time (e.g., 0.234s)
- ✅ Shows response body excerpt
- ✅ Last status updated in webhook list

### Verify on webhook.site:

- ✅ Request received
- ✅ Contains test payload: `{"test": true}`

## Test 13: Webhook Triggers

### Steps:

1. Create a webhook for "product.created"
2. Create a new product
3. Check webhook.site for received webhook

### Expected Results:

- ✅ Webhook triggered automatically
- ✅ Payload contains product data
- ✅ Includes: id, sku, name

### Test upload.completed:

1. Create webhook for "upload.completed"
2. Upload a CSV file
3. Check webhook.site

### Expected Results:

- ✅ Webhook triggered after upload completes
- ✅ Payload contains: task_id, total_rows, created, updated

## Test 14: Webhook Enable/Disable

### Steps:

1. Edit a webhook
2. Uncheck "Enabled"
3. Save
4. Trigger an event (create product)
5. Verify webhook NOT called

### Expected Results:

- ✅ Disabled webhooks don't receive events
- ✅ Status badge shows "Disabled"

## Test 15: Error Handling

### Test Invalid CSV:

1. Create file with wrong columns:
   ```csv
   wrong,columns,here
   1,2,3
   ```
2. Upload it

### Expected Results:

- ✅ Error message displayed
- ✅ No products created
- ✅ Can retry with correct file

### Test Invalid Product Data:

1. Try creating product with empty SKU
2. Try creating product with negative price

### Expected Results:

- ✅ Validation errors shown
- ✅ Form doesn't submit
- ✅ Clear error messages

## Test 16: Concurrent Uploads

### Steps:

1. Open two browser tabs
2. Upload different CSV files simultaneously
3. Watch both progress bars

### Expected Results:

- ✅ Both uploads process independently
- ✅ Progress tracked separately
- ✅ Both complete successfully
- ✅ No data corruption

## Test 17: Admin Panel

### Steps:

1. Navigate to http://localhost:8000/admin/
2. Login with superuser credentials
3. Browse Products and Webhooks

### Expected Results:

- ✅ Products listed with filters
- ✅ Can edit products
- ✅ Webhooks manageable
- ✅ Search functionality works

## Test 18: Browser Compatibility

Test in multiple browsers:

- Chrome
- Firefox
- Safari
- Edge

### Expected Results:

- ✅ UI renders correctly
- ✅ All features work
- ✅ SSE progress works
- ✅ Modals function properly

## Test 19: Mobile Responsiveness

### Steps:

1. Open on mobile device or use browser dev tools
2. Test all pages
3. Try uploading CSV
4. Try managing products

### Expected Results:

- ✅ Layout adapts to screen size
- ✅ Navigation accessible
- ✅ Forms usable
- ✅ Tables scrollable

## Test 20: Performance Test

### Create Very Large CSV:

```python
# 100,000 products
with open('huge_test.csv', 'w') as f:
    f.write('sku,name,description,price\n')
    for i in range(100000):
        f.write(f'HUGE{i:06d},Product {i},Description {i},{10 + i * 0.01:.2f}\n')
```

### Steps:

1. Upload the huge CSV
2. Monitor progress
3. Check Celery worker logs
4. Verify completion

### Expected Results:

- ✅ Upload completes (may take several minutes)
- ✅ Progress updates regularly
- ✅ No memory issues
- ✅ All products imported correctly
- ✅ UI remains responsive

## Automated Testing Commands

### Check System:

```bash
python manage.py check
```

### Run Migrations:

```bash
python manage.py migrate --check
```

### Test Database Queries:

```bash
python manage.py shell
>>> from products.models import Product
>>> Product.objects.all().count()
>>> Product.objects.filter(active=True).count()
```

### Test Redis Connection:

```bash
redis-cli ping
redis-cli KEYS "upload:*"
```

### Test Celery:

```bash
# In Django shell
from products.tasks import process_csv_upload
result = process_csv_upload.delay("sku,name,description,price\nTEST,Test,Desc,10", "test-task")
```

## Common Issues and Solutions

### Issue: Progress not updating

**Solution:** Check Celery worker is running and Redis is accessible

### Issue: Webhooks not triggering

**Solution:** Verify webhook is enabled and Celery worker is processing tasks

### Issue: Upload fails silently

**Solution:** Check Celery worker logs for errors

### Issue: Products not appearing

**Solution:** Verify CSV format matches expected columns

## Test Results Checklist

- [ ] CSV upload works
- [ ] Progress tracking works
- [ ] Large files handled
- [ ] Duplicates handled correctly
- [ ] Case-insensitive SKU works
- [ ] Product list displays
- [ ] Pagination works
- [ ] Filtering works
- [ ] Create product works
- [ ] Edit product works
- [ ] Delete product works
- [ ] Bulk delete works
- [ ] Webhook creation works
- [ ] Webhook testing works
- [ ] Webhook triggers work
- [ ] Enable/disable works
- [ ] Error handling works
- [ ] Admin panel works
- [ ] Mobile responsive
- [ ] Performance acceptable

## Success Criteria

All tests should pass with:

- No errors in browser console
- No errors in Django logs
- No errors in Celery logs
- Smooth user experience
- Fast response times
- Accurate data handling

Happy Testing! 🧪
