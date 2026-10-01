/**
 * Status Page Module
 * Handles system status display
 */

document.addEventListener('DOMContentLoaded', () => {
    loadSystemStatus();
    loadIncidents();
});

/**
 * Load system status
 */
async function loadSystemStatus() {
    const services = [
        { id: 'website', name: 'Website' },
        { id: 'api', name: 'API' },
        { id: 'pterodactyl-panel', name: 'Pterodactyl Panel' },
        { id: 'pterodactyl-wings', name: 'Pterodactyl Wings' },
        { id: 'database', name: 'Database' },
        { id: 'discord-auth', name: 'Discord Authentication' }
    ];
    
    const statusContainer = document.getElementById('status-services');
    
    if (!statusContainer) return;
    
    try {
        const response = await API.status.getStatus();
        
        if (response.success && response.data) {
            const statuses = response.data;
            
            const html = services.map(service => {
                const status = statuses[service.id] || 'unknown';
                return `
                    <div class="status-item">
                        <div class="status-item-name">${service.name}</div>
                        <div class="status-item-indicator status-${status}">
                            <span class="status-dot"></span>
                            ${capitalizeFirst(status)}
                        </div>
                    </div>
                `;
            }).join('');
            
            statusContainer.innerHTML = html;
        } else {
            statusContainer.innerHTML = '<div class="empty-state">Monitoring data unavailable</div>';
        }
    } catch (error) {
        statusContainer.innerHTML = '<div class="empty-state">Monitoring data unavailable</div>';
    }
}

/**
 * Load incidents
 */
async function loadIncidents() {
    const incidentsContainer = document.getElementById('incidents-list');
    
    if (!incidentsContainer) return;
    
    try {
        const response = await API.status.getIncidents();
        
        if (response.success && response.data && response.data.length > 0) {
            const html = response.data.map(incident => `
                <div class="incident-item">
                    <div class="incident-title">${escapeHtml(incident.title)}</div>
                    <div class="incident-status status-${incident.status}">
                        <span class="status-dot"></span>
                        ${capitalizeFirst(incident.status)}
                    </div>
                    <div class="incident-date">${formatDateTime(incident.created)}</div>
                    <div class="incident-description">${escapeHtml(incident.description)}</div>
                </div>
            `).join('');
            
            incidentsContainer.innerHTML = html;
        } else {
            incidentsContainer.innerHTML = '<div class="empty-state">No incidents reported</div>';
        }
    } catch (error) {
        incidentsContainer.innerHTML = '<div class="empty-state">No incidents reported</div>';
    }
}
