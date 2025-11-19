// Load webhooks
async function loadWebhooks() {
    try {
        const data = await apiRequest('/webhooks/api/webhooks/');
        displayWebhooks(data);
    } catch (error) {
        alert('Error loading webhooks: ' + error.message);
    }
}

function displayWebhooks(data) {
    const container = document.getElementById('webhooksTable');
    
    if (data.webhooks.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem;">No webhooks configured</p>';
        return;
    }
    
    let html = '<table><thead><tr>';
    html += '<th>URL</th><th>Event</th><th>Status</th><th>Last Response</th><th>Actions</th>';
    html += '</tr></thead><tbody>';
    
    data.webhooks.forEach(webhook => {
        const statusBadge = webhook.enabled ? 
            '<span class="badge badge-success">Enabled</span>' : 
            '<span class="badge badge-danger">Disabled</span>';
        
        const lastStatus = webhook.last_status ? 
            `${webhook.last_status} (${webhook.last_response_time}s)` : 
            'Not tested';
        
        html += `<tr>
            <td>${webhook.url}</td>
            <td>${webhook.event_type}</td>
            <td>${statusBadge}</td>
            <td>${lastStatus}</td>
            <td class="table-actions">
                <button class="btn btn-primary" onclick="editWebhook('${webhook.id}')">Edit</button>
                <button class="btn" onclick="testWebhook('${webhook.id}')">Test</button>
                <button class="btn btn-danger" onclick="deleteWebhook('${webhook.id}')">Delete</button>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}


// Modal handling
const modal = document.getElementById('webhookModal');
const closeBtn = modal.querySelector('.close');

closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
};

document.getElementById('createWebhookBtn').onclick = () => {
    document.getElementById('modalTitle').textContent = 'Create Webhook';
    document.getElementById('webhookForm').reset();
    document.getElementById('webhookId').value = '';
    modal.style.display = 'block';
};

async function editWebhook(id) {
    try {
        const data = await apiRequest('/webhooks/api/webhooks/');
        const webhook = data.webhooks.find(w => w.id === id);
        
        if (webhook) {
            document.getElementById('modalTitle').textContent = 'Edit Webhook';
            document.getElementById('webhookId').value = webhook.id;
            document.getElementById('webhookUrl').value = webhook.url;
            document.getElementById('webhookEventType').value = webhook.event_type;
            document.getElementById('webhookEnabled').checked = webhook.enabled;
            modal.style.display = 'block';
        }
    } catch (error) {
        alert('Error loading webhook: ' + error.message);
    }
}

document.getElementById('webhookForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('webhookId').value;
    const data = {
        url: document.getElementById('webhookUrl').value,
        event_type: document.getElementById('webhookEventType').value,
        enabled: document.getElementById('webhookEnabled').checked
    };
    
    try {
        if (id) {
            await apiRequest(`/webhooks/api/webhooks/${id}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            await apiRequest('/webhooks/api/webhooks/create/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        modal.style.display = 'none';
        loadWebhooks();
    } catch (error) {
        alert('Error saving webhook: ' + error.message);
    }
};

async function deleteWebhook(id) {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    
    try {
        await apiRequest(`/webhooks/api/webhooks/${id}/delete/`, { method: 'DELETE' });
        loadWebhooks();
    } catch (error) {
        alert('Error deleting webhook: ' + error.message);
    }
}

async function testWebhook(id) {
    try {
        const result = await apiRequest(`/webhooks/api/webhooks/${id}/test/`, { method: 'POST' });
        
        const resultModal = document.getElementById('testResultModal');
        const resultDiv = document.getElementById('testResult');
        
        let html = '<div style="padding: 1rem;">';
        if (result.status) {
            html += `<p><strong>Status:</strong> ${result.status}</p>`;
            html += `<p><strong>Response Time:</strong> ${result.response_time}s</p>`;
            if (result.body) {
                html += `<p><strong>Response:</strong></p><pre>${result.body}</pre>`;
            }
        } else {
            html += `<p class="error"><strong>Error:</strong> ${result.error}</p>`;
        }
        html += '</div>';
        
        resultDiv.innerHTML = html;
        resultModal.style.display = 'block';
        
        loadWebhooks();
    } catch (error) {
        alert('Error testing webhook: ' + error.message);
    }
}

// Close test result modal
document.querySelectorAll('#testResultModal .close').forEach(btn => {
    btn.onclick = () => document.getElementById('testResultModal').style.display = 'none';
});

// Initial load
loadWebhooks();
