/**
 * Dashboard Module
 * Handles dashboard functionality and server list
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!requireAuth()) return;
    
    initializeDashboard();
    initializeSidebar();
    initializeServerList();
});

/**
 * Initialize dashboard
 */
async function initializeDashboard() {
    // Load user info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const welcomeEl = document.getElementById('dashboard-welcome');
    if (welcomeEl) {
        welcomeEl.textContent = `Welcome back, ${user.username || 'User'}`;
    }
    
    // Load stats
    await loadStats();
}

/**
 * Initialize sidebar navigation
 */
function initializeSidebar() {
    const navLinks = document.querySelectorAll('.sidebar-nav-link');
    const sections = document.querySelectorAll('.dashboard-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetSection = link.getAttribute('data-section');
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show target section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
        });
    });
    
    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.dashboard-sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
}

/**
 * Load dashboard statistics
 */
async function loadStats() {
    const serversEl = document.getElementById('stat-servers');
    const runningEl = document.getElementById('stat-running');
    const stoppedEl = document.getElementById('stat-stopped');
    const ramEl = document.getElementById('stat-ram');
    
    try {
        const response = await API.server.getServers();
        
        if (response.success && response.data) {
            const servers = response.data;
            
            // Calculate stats
            const totalServers = servers.length;
            const runningServers = servers.filter(s => s.status === 'running' || s.status === 'online').length;
            const stoppedServers = servers.filter(s => s.status === 'offline' || s.status === 'stopped').length;
            const totalRam = servers.reduce((sum, s) => sum + (s.limits?.memory || 0), 0);
            
            // Update UI
            if (serversEl) serversEl.textContent = totalServers;
            if (runningEl) runningEl.textContent = runningServers;
            if (stoppedEl) stoppedEl.textContent = stoppedServers;
            if (ramEl) ramEl.textContent = formatBytes(totalRam);
        } else {
            // Show empty state
            if (serversEl) serversEl.textContent = '—';
            if (runningEl) runningEl.textContent = '—';
            if (stoppedEl) stoppedEl.textContent = '—';
            if (ramEl) ramEl.textContent = '—';
        }
    } catch (error) {
        // Show empty state on error
        if (serversEl) serversEl.textContent = '—';
        if (runningEl) runningEl.textContent = '—';
        if (stoppedEl) stoppedEl.textContent = '—';
        if (ramEl) ramEl.textContent = '—';
    }
}

/**
 * Initialize server list
 */
async function initializeServerList() {
    const serverList = document.getElementById('server-list');
    
    if (!serverList) return;
    
    try {
        const response = await API.server.getServers();
        
        if (response.success && response.data && response.data.length > 0) {
            renderServerList(response.data);
        } else {
            showEmptyServerList();
        }
    } catch (error) {
        showEmptyServerList();
    }
}

/**
 * Render server list
 */
function renderServerList(servers) {
    const serverList = document.getElementById('server-list');
    
    const html = servers.map(server => `
        <div class="server-item">
            <div class="server-info">
                <div class="server-name">${escapeHtml(server.name)}</div>
                <div class="server-details">
                    ${formatBytes(server.limits?.memory || 0)} RAM • 
                    ${server.limits?.cpu || 0}% CPU • 
                    ${formatBytes(server.limits?.disk || 0)} Storage
                </div>
            </div>
            <div class="server-status">
                <span class="status status-${getStatusClass(server.status)}">
                    <span class="status-dot"></span>
                    ${capitalizeFirst(server.status || 'Unknown')}
                </span>
            </div>
            <div class="server-actions">
                <a href="server.html?id=${server.id}" class="btn btn-secondary btn-sm">Manage</a>
            </div>
        </div>
    `).join('');
    
    serverList.innerHTML = html;
}

/**
 * Show empty server list
 */
function showEmptyServerList() {
    const serverList = document.getElementById('server-list');
    
    serverList.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <div class="empty-state-title">No servers found</div>
            <p>Create your first Discord bot server to get started</p>
            <a href="create-server.html" class="btn btn-primary mt-md">Create Server</a>
        </div>
    `;
}

/**
 * Get status CSS class
 */
function getStatusClass(status) {
    const statusMap = {
        'running': 'online',
        'online': 'online',
        'offline': 'offline',
        'stopped': 'offline',
        'starting': 'starting',
        'stopping': 'stopping',
        'suspended': 'suspended'
    };
    
    return statusMap[status] || 'offline';
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
