import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Search, Filter, X } from 'lucide-react'
import axios from 'axios'
import './Products.css'

function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState({ sku: '', name: '', active: '' })
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    active: true,
  })

  useEffect(() => {
    loadProducts()
  }, [page, filters])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ 
        page, 
        ...filters,
        _t: Date.now() // Cache buster
      })
      const response = await axios.get(`/products/api/products/?${params}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      setProducts(response.data.products)
      setTotalPages(response.data.total_pages)
      setTotalCount(response.data.total_count)
    } catch (error) {
      console.error('Error loading products:', error)
    }
    setLoading(false)
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setFormData({ sku: '', name: '', description: '', price: '', active: true })
    setShowModal(true)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData(product)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingProduct) {
        await axios.put(`/products/api/products/${editingProduct.id}/`, formData)
      } else {
        await axios.post('/products/api/products/create/', formData)
      }
      setShowModal(false)
      loadProducts()
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving product')
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this product?')) {
      try {
        await axios.delete(`/products/api/products/${id}/delete/`)
        loadProducts()
      } catch (error) {
        alert('Error deleting product')
      }
    }
  }

  const handleBulkDelete = async () => {
    setDeleting(true)
    try {
      const response = await axios.delete('/products/api/products/bulk-delete/')
      const deletedCount = response.data.deleted_count || totalCount
      
      setShowDeleteModal(false)
      setDeleting(false)
      
      // Reset to page 1 and reload
      setPage(1)
      setProducts([])
      setTotalCount(0)
      setTotalPages(1)
      
      await loadProducts()
      
      alert(`✅ Successfully deleted ${deletedCount.toLocaleString()} product${deletedCount !== 1 ? 's' : ''}!`)
    } catch (error) {
      setDeleting(false)
      alert('❌ Error deleting products: ' + (error.response?.data?.error || error.message))
    }
  }

  return (
    <motion.div
      className="container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="card">
        <div className="card-header">
          <div className="header-left">
            <h1 className="card-title">Product Management</h1>
            {totalCount > 0 && (
              <span className="total-count">
                {totalCount.toLocaleString()} product{totalCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="header-actions">
            <motion.button
              className="btn btn-primary"
              onClick={handleCreate}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={20} />
              Create Product
            </motion.button>
            <motion.button
              className="btn btn-danger"
              onClick={() => setShowDeleteModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 size={20} />
              Delete All
            </motion.button>
          </div>
        </div>

        <div className="filters-bar">
          <div className="filter-group">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by SKU..."
              value={filters.sku}
              onChange={(e) => setFilters({ ...filters, sku: e.target.value })}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by name..."
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <Filter size={20} />
            <select
              value={filters.active}
              onChange={(e) => setFilters({ ...filters, active: e.target.value })}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No products found</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {products.map((product, index) => (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td><code>{product.sku}</code></td>
                        <td>{product.name}</td>
                        <td>${product.price}</td>
                        <td>
                          <span className={`badge ${product.active ? 'badge-success' : 'badge-danger'}`}>
                            {product.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <motion.button
                              className="btn-icon btn-edit"
                              onClick={() => handleEdit(product)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Edit size={18} />
                            </motion.button>
                            <motion.button
                              className="btn-icon btn-delete"
                              onClick={() => handleDelete(product.id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span className="page-info">Page {page} of {totalPages}</span>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">
                  {editingProduct ? 'Edit Product' : 'Create Product'}
                </h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">SKU</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showDeleteModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              className="modal confirm-modal"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">⚠️ Confirm Bulk Delete</h2>
              </div>
              <div className="modal-body">
                <div className="delete-warning">
                  <p className="warning-text">
                    You are about to delete <strong>{totalCount.toLocaleString()}</strong> product{totalCount !== 1 ? 's' : ''}.
                  </p>
                  <p className="warning-subtext">
                    This action cannot be undone and will permanently remove all products from the database.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleBulkDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : `Yes, Delete All ${totalCount.toLocaleString()}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Products
