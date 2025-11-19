import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, X, Zap, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'
import './Webhooks.css'

function Webhooks() {
  const [webhooks, setWebhooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [editingWebhook, setEditingWebhook] = useState(null)
  const [formData, setFormData] = useState({
    url: '',
    event_type: 'product.created',
    enabled: true,
  })

  useEffect(() => {
    loadWebhooks()
  }, [])

  const loadWebhooks = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/webhooks/api/webhooks/')
      setWebhooks(response.data.webhooks)
    } catch (error) {
      console.error('Error loading webhooks:', error)
    }
    setLoading(false)
  }

  const handleCreate = () => {
    setEditingWebhook(null)
    setFormData({ url: '', event_type: 'product.created', enabled: true })
    setShowModal(true)
  }

  const handleEdit = (webhook) => {
    setEditingWebhook(webhook)
    setFormData(webhook)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingWebhook) {
        await axios.put(`/webhooks/api/webhooks/${editingWebhook.id}/`, formData)
      } else {
        await axios.post('/webhooks/api/webhooks/create/', formData)
      }
      setShowModal(false)
      loadWebhooks()
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving webhook')
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this webhook?')) {
      try {
        await axios.delete(`/webhooks/api/webhooks/${id}/delete/`)
        loadWebhooks()
      } catch (error) {
        alert('Error deleting webhook')
      }
    }
  }

  const handleTest = async (id) => {
    try {
      const response = await axios.post(`/webhooks/api/webhooks/${id}/test/`)
      setTestResult(response.data)
      setShowTestModal(true)
      loadWebhooks()
    } catch (error) {
      alert('Error testing webhook')
    }
  }

  const getEventBadgeColor = (eventType) => {
    const colors = {
      'product.created': 'badge-success',
      'product.updated': 'badge-warning',
      'upload.completed': 'badge-info',
    }
    return colors[eventType] || 'badge-secondary'
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
          <h1 className="card-title">Webhook Management</h1>
          <motion.button
            className="btn btn-primary"
            onClick={handleCreate}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={20} />
            Add Webhook
          </motion.button>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : webhooks.length === 0 ? (
          <div className="empty-state">
            <Zap size={48} className="empty-icon" />
            <p>No webhooks configured</p>
            <button className="btn btn-primary" onClick={handleCreate}>
              Create Your First Webhook
            </button>
          </div>
        ) : (
          <div className="webhooks-grid">
            <AnimatePresence>
              {webhooks.map((webhook, index) => (
                <motion.div
                  key={webhook.id}
                  className="webhook-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="webhook-header">
                    <span className={`badge ${getEventBadgeColor(webhook.event_type)}`}>
                      {webhook.event_type}
                    </span>
                    <span className={`badge ${webhook.enabled ? 'badge-success' : 'badge-danger'}`}>
                      {webhook.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  <div className="webhook-url">
                    <code>{webhook.url}</code>
                  </div>

                  {webhook.last_status && (
                    <div className="webhook-status">
                      {webhook.last_status === 200 ? (
                        <CheckCircle size={16} className="status-success" />
                      ) : (
                        <XCircle size={16} className="status-error" />
                      )}
                      <span>Status: {webhook.last_status}</span>
                      {webhook.last_response_time && (
                        <span className="response-time">
                          {webhook.last_response_time.toFixed(3)}s
                        </span>
                      )}
                    </div>
                  )}

                  <div className="webhook-actions">
                    <motion.button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleTest(webhook.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Zap size={16} />
                      Test
                    </motion.button>
                    <motion.button
                      className="btn-icon btn-edit"
                      onClick={() => handleEdit(webhook)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit size={18} />
                    </motion.button>
                    <motion.button
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(webhook.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
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
                  {editingWebhook ? 'Edit Webhook' : 'Create Webhook'}
                </h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">URL</label>
                    <input
                      type="url"
                      className="form-input"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://example.com/webhook"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Event Type</label>
                    <select
                      className="form-select"
                      value={formData.event_type}
                      onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    >
                      <option value="product.created">Product Created</option>
                      <option value="product.updated">Product Updated</option>
                      <option value="upload.completed">Upload Completed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.enabled}
                        onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      />
                      <span>Enabled</span>
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

        {showTestModal && testResult && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTestModal(false)}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">Test Result</h2>
                <button className="modal-close" onClick={() => setShowTestModal(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className="modal-body">
                <div className="test-result">
                  {testResult.status ? (
                    <>
                      <div className="result-item">
                        <span className="result-label">Status:</span>
                        <span className={`badge ${testResult.status === 200 ? 'badge-success' : 'badge-danger'}`}>
                          {testResult.status}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Response Time:</span>
                        <span>{testResult.response_time}s</span>
                      </div>
                      {testResult.body && (
                        <div className="result-item">
                          <span className="result-label">Response:</span>
                          <pre className="result-body">{testResult.body}</pre>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="error-message">
                      <XCircle size={24} />
                      <span>{testResult.error}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setShowTestModal(false)}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Webhooks
