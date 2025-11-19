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
        const taskId = data.task_id;
        const eventSource = new EventSource(`/products/api/upload/progress/${taskId}/`);
        
        eventSource.onmessage = (event) => {
            const progress = JSON.parse(event.data);
            
            // Update progress bar
            document.getElementById('progressBar').style.width = progress.progress + '%';
            document.getElementById('progressText').textContent = progress.progress + '%';
            document.getElementById('statusText').textContent = progress.status;
            
            // Check if completed or error
            if (progress.status === 'Completed') {
                eventSource.close();
                showMessage('uploadResult', 'Upload completed successfully!', 'success');
                fileInput.value = '';
                setTimeout(() => {
                    document.getElementById('uploadProgress').style.display = 'none';
                }, 3000);
            } else if (progress.status === 'Error') {
                eventSource.close();
                showMessage('uploadResult', 'Error: ' + (progress.error || 'Unknown error'), 'error');
            }
        };
        
        eventSource.onerror = () => {
            eventSource.close();
            showMessage('uploadResult', 'Connection error. Please refresh to check status.', 'error');
        };
        
    } catch (error) {
        showMessage('uploadResult', error.message, 'error');
        document.getElementById('uploadProgress').style.display = 'none';
    }
});
