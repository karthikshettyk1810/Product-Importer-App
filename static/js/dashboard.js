let currentEventSource = null;
let currentTaskId = null;

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showMessage('uploadResult', 'Please select a file', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        // Hide previous results
        hideMessage('uploadResult');
        document.getElementById('uploadProgress').style.display = 'block';
        document.getElementById('cancelUpload').style.display = 'inline-block';
        
        // Upload file
        const response = await fetch('/products/api/upload/', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }
        
        // Start SSE for progress updates
        currentTaskId = data.task_id;
        currentEventSource = new EventSource(`/products/api/upload/progress/${currentTaskId}/`);
        
        currentEventSource.onmessage = (event) => {
            const progress = JSON.parse(event.data);
            
            // Update progress bar
            document.getElementById('progressBar').style.width = progress.progress + '%';
            document.getElementById('progressText').textContent = progress.progress + '%';
            document.getElementById('statusText').textContent = progress.status;
            
            // Check if completed or error
            if (progress.status === 'Completed') {
                currentEventSource.close();
                currentEventSource = null;
                currentTaskId = null;
                showMessage('uploadResult', 'Upload completed successfully!', 'success');
                fileInput.value = '';
                setTimeout(() => {
                    document.getElementById('uploadProgress').style.display = 'none';
                }, 3000);
            } else if (progress.status === 'Error') {
                currentEventSource.close();
                currentEventSource = null;
                currentTaskId = null;
                showMessage('uploadResult', 'Error: ' + (progress.error || 'Unknown error'), 'error');
            }
        };
        
        currentEventSource.onerror = () => {
            currentEventSource.close();
            currentEventSource = null;
            currentTaskId = null;
            showMessage('uploadResult', 'Connection error. Please refresh to check status.', 'error');
        };
        
    } catch (error) {
        showMessage('uploadResult', error.message, 'error');
        document.getElementById('uploadProgress').style.display = 'none';
    }
});

// Cancel upload functionality
document.getElementById('cancelUpload').addEventListener('click', () => {
    if (currentEventSource) {
        currentEventSource.close();
        currentEventSource = null;
    }
    
    if (currentTaskId) {
        // Optionally, you can call an API to revoke the task
        // For now, we'll just stop listening to progress
        currentTaskId = null;
    }
    
    // Reset UI
    document.getElementById('uploadProgress').style.display = 'none';
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressText').textContent = '0%';
    document.getElementById('statusText').textContent = 'Initializing...';
    document.getElementById('csvFile').value = '';
    
    showMessage('uploadResult', 'Upload cancelled by user', 'warning');
});
