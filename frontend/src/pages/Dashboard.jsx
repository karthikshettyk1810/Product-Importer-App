import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import axios from 'axios'
import './Dashboard.css'

function Dashboard() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [displayProgress, setDisplayProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const eventSourceRef = useRef(null)

  // Smooth progress animation
  useEffect(() => {
    if (displayProgress < progress) {
      const timer = setTimeout(() => {
        setDisplayProgress(prev => {
          const diff = progress - prev
          const increment = Math.max(1, Math.ceil(diff / 10))
          return Math.min(prev + increment, progress)
        })
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [progress, displayProgress])

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const simulateUploadProgress = () => {
    return new Promise((resolve) => {
      let currentProgress = 0
      const interval = setInterval(() => {
        currentProgress += Math.random() * 15
        if (currentProgress >= 30) {
          setProgress(30)
          clearInterval(interval)
          resolve()
        } else {
          setProgress(Math.floor(currentProgress))
        }
      }, 200)
    })
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setProgress(0)
    setDisplayProgress(0)
    setStatus('Uploading file...')

    const formData = new FormData()
    formData.append('file', file)

    let eventSource = null
    let isCompleted = false

    try {
      // Simulate upload progress (0-30%)
      await simulateUploadProgress()
      
      setStatus('Processing...')
      
      // Actual upload
      const response = await axios.post('/products/api/upload/', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 30) / progressEvent.total)
          setProgress(percentCompleted)
        }
      })
      
      const taskId = response.data.task_id
      setStatus('Parsing CSV...')

      // Start SSE for progress
      eventSource = new EventSource(`/products/api/upload/progress/${taskId}/`)
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Map backend progress (0-100) to display progress (30-100)
          const mappedProgress = 30 + Math.floor((data.progress * 70) / 100)
          setProgress(mappedProgress)
          setStatus(data.status)

          if (data.status === 'Completed') {
            isCompleted = true
            setProgress(100)
            
            // Close connection immediately
            if (eventSource) {
              eventSource.close()
              eventSourceRef.current = null
            }
            
            setUploading(false)
            setTimeout(() => {
              setFile(null)
              setProgress(0)
              setDisplayProgress(0)
              setStatus('')
            }, 3000)
          } else if (data.status === 'Error') {
            if (eventSource) {
              eventSource.close()
              eventSourceRef.current = null
            }
            setError(data.error || 'Upload failed')
            setUploading(false)
          }
        } catch (parseError) {
          console.error('Error parsing SSE data:', parseError)
        }
      }

      eventSource.onerror = (err) => {
        // Only show error if not completed and still uploading
        if (!isCompleted && uploading) {
          console.error('SSE Error:', err)
          if (eventSource) {
            eventSource.close()
            eventSourceRef.current = null
          }
          setError('Connection error. Please check if Celery worker is running.')
          setUploading(false)
        } else {
          // Connection closed after completion - this is normal, just close silently
          if (eventSource) {
            eventSource.close()
            eventSourceRef.current = null
          }
        }
      }
    } catch (err) {
      if (eventSource) {
        eventSource.close()
        eventSourceRef.current = null
      }
      setError(err.response?.data?.error || 'Upload failed')
      setUploading(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return (
    <motion.div
      className="container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="dashboard">
        <motion.div
          className="card upload-card"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="card-header">
            <h1 className="card-title">CSV Upload</h1>
          </div>

          <div
            className={`upload-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!file ? (
              <motion.div
                className="upload-placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Upload size={48} className="upload-icon" />
                <h3>Drag & drop your CSV file here</h3>
                <p>or</p>
                <label className="btn btn-primary">
                  <FileText size={20} />
                  Choose File
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </motion.div>
            ) : (
              <motion.div
                className="file-info"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <FileText size={48} className="file-icon" />
                <div className="file-details">
                  <h3>{file.name}</h3>
                  <p>{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                {!uploading && (
                  <button className="btn btn-danger" onClick={() => setFile(null)}>
                    Remove
                  </button>
                )}
              </motion.div>
            )}
          </div>

          {file && !uploading && !error && progress === 0 && (
            <motion.button
              className="btn btn-primary upload-btn"
              onClick={handleUpload}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Upload size={20} />
              Start Upload
            </motion.button>
          )}

          {uploading && (
            <motion.div
              className="progress-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <div className="progress-header">
                <span className="progress-text">{displayProgress}%</span>
                <span className="status-text">{status}</span>
              </div>
              <div className="progress-bar-container">
                <motion.div
                  className="progress-bar-fill"
                  style={{ width: `${displayProgress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <motion.div
                    className="progress-shine"
                    animate={{
                      x: ['-100%', '200%']
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />
                </motion.div>
              </div>
              <div className="progress-loader">
                <Loader className="spinner" size={20} />
                <span>Processing your data...</span>
              </div>
              <div className="progress-stats">
                <div className="stat-item">
                  <span className="stat-label">Stage:</span>
                  <span className="stat-value">
                    {displayProgress < 30 ? 'Uploading' : 
                     displayProgress < 50 ? 'Parsing' : 
                     displayProgress < 80 ? 'Validating' : 
                     displayProgress < 100 ? 'Importing' : 'Complete'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {progress === 100 && status === 'Completed' && (
            <motion.div
              className="success-message"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <CheckCircle size={24} />
              <span>Upload completed successfully!</span>
            </motion.div>
          )}

          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <AlertCircle size={24} />
              <span>{error}</span>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setError(null)
                  setProgress(0)
                  setDisplayProgress(0)
                }}
              >
                Try Again
              </button>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className="card info-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="info-title">📋 Instructions</h2>
          <ul className="info-list">
            <li>CSV must contain columns: <code>sku</code>, <code>name</code>, <code>description</code>, <code>price</code></li>
            <li>SKU is case-insensitive and must be unique</li>
            <li>Duplicate SKUs will update existing products</li>
            <li>Supports up to 500,000 records</li>
            <li>Real-time progress tracking</li>
          </ul>
          
          <div className="info-features">
            <h3>✨ Features</h3>
            <div className="feature-grid">
              <div className="feature-item">
                <Upload size={20} />
                <span>Drag & Drop</span>
              </div>
              <div className="feature-item">
                <Loader size={20} />
                <span>Real-time Progress</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={20} />
                <span>Auto Validation</span>
              </div>
              <div className="feature-item">
                <FileText size={20} />
                <span>Batch Processing</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Dashboard
