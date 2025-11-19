let currentPage = 1;
let currentFilters = {};

// Load products
async function loadProducts() {
    try {
        const params = new URLSearchParams({
            page: currentPage,
            ...currentFilters
        });
        
        const data = await apiRequest(`/products/api/products/?${params}`);
        displayProducts(data);
    } catch (error) {
        alert('Error loading products: ' + error.message);
    }
}

// Display products
function displayProducts(data) {
    const container = document.getElementById('productsTable');
    
    if (data.products.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem;">No products found</p>';
        return;
    }
    
    let html = '<table><thead><tr>';
    html += '<th>SKU</th><th>Name</th><th>Price</th><th>Status</th><th>Actions</th>';
    html += '</tr></thead><tbody>';

    
    data.products.forEach(product => {
        const statusClass = product.active ? 'status-active' : 'status-inactive';
        const statusText = product.active ? 'Active' : 'Inactive';
        
        html += `<tr>
            <td>${product.sku}</td>
            <td>${product.name}</td>
            <td>$${product.price}</td>
            <td><span class="status-indicator ${statusClass}"></span>${statusText}</td>
            <td class="table-actions">
                <button class="btn btn-primary" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">Delete</button>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
    // Pagination
    displayPagination(data.page, data.total_pages);
}

function displayPagination(page, totalPages) {
    const container = document.getElementById('pagination');
    let html = '';
    
    if (page > 1) {
        html += `<button class="btn" onclick="changePage(${page - 1})">Previous</button>`;
    }
    
    html += `<span>Page ${page} of ${totalPages}</span>`;
    
    if (page < totalPages) {
        html += `<button class="btn" onclick="changePage(${page + 1})">Next</button>`;
    }
    
    container.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    loadProducts();
}


// Modal handling
const modal = document.getElementById('productModal');
const closeBtn = modal.querySelector('.close');

closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
};

document.getElementById('createProductBtn').onclick = () => {
    document.getElementById('modalTitle').textContent = 'Create Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    modal.style.display = 'block';
};

async function editProduct(id) {
    try {
        const params = new URLSearchParams({ page: 1 });
        const data = await apiRequest(`/products/api/products/?${params}`);
        const product = data.products.find(p => p.id === id);
        
        if (product) {
            document.getElementById('modalTitle').textContent = 'Edit Product';
            document.getElementById('productId').value = product.id;
            document.getElementById('productSku').value = product.sku;
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productActive').checked = product.active;
            modal.style.display = 'block';
        }
    } catch (error) {
        alert('Error loading product: ' + error.message);
    }
}

document.getElementById('productForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('productId').value;
    const data = {
        sku: document.getElementById('productSku').value,
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value),
        active: document.getElementById('productActive').checked
    };

    
    try {
        if (id) {
            await apiRequest(`/products/api/products/${id}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            await apiRequest('/products/api/products/create/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        modal.style.display = 'none';
        loadProducts();
    } catch (error) {
        alert('Error saving product: ' + error.message);
    }
};

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        await apiRequest(`/products/api/products/${id}/delete/`, { method: 'DELETE' });
        loadProducts();
    } catch (error) {
        alert('Error deleting product: ' + error.message);
    }
}

// Bulk delete
const confirmModal = document.getElementById('confirmModal');
document.getElementById('bulkDeleteBtn').onclick = () => {
    confirmModal.style.display = 'block';
};

document.getElementById('cancelDelete').onclick = () => {
    confirmModal.style.display = 'none';
};

document.getElementById('confirmDelete').onclick = async () => {
    try {
        await apiRequest('/products/api/products/bulk-delete/', { method: 'DELETE' });
        confirmModal.style.display = 'none';
        alert('All products deleted successfully');
        loadProducts();
    } catch (error) {
        alert('Error deleting products: ' + error.message);
    }
};

// Filters
document.getElementById('applyFilters').onclick = () => {
    currentFilters = {
        sku: document.getElementById('skuFilter').value,
        name: document.getElementById('nameFilter').value,
        active: document.getElementById('activeFilter').value
    };
    currentPage = 1;
    loadProducts();
};

// Initial load
loadProducts();
