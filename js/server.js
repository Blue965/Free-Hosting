/**
 * Server Management Module
 * Handles server console, resources, and files
 */

let currentServerId = null;
let consoleInterval = null;
let resourcesInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!requireAuth()) return;
    
    // Get server ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentServerId = urlParams.get('id');
    
    if (!currentServerId) {
        showAlert('Server ID not found', 'error');
        window.location.href = 'dashboard.html';
        return;
    }
    
    initializeServer();
    initializeSidebar();
    initializeTabs();
    initializePowerControls();
    initializeConsole();
    initializeResources();
    initializeFiles();
    initializeStartup();
    initializeSettings();
});

/**
 * Initialize server page
 */
async function initializeServer() {
    try {
        const response = await API.server.getServer(currentServerId);
        
        if (response.success && response.data) {
            const server = response.data;
            
            // Update server name
            const serverNameEl = document.getElementById('server-name');
            if (serverNameEl) {
                serverNameEl.textContent = server.name;
            }
            
            // Update status
            updateServerStatus(server.status);
        } else {
            showAlert('Server not found', 'error');
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        showAlert('Unable to load server', 'error');
    }
}

/**
 * Update server status
 */
function updateServerStatus(status) {
    const statusEl = document.getElementById('server-status');
    if (!statusEl) return;
    
    const statusClass = getStatusClass(status);
    statusEl.className = `status status-${statusClass}`;
    statusEl.innerHTML = `<span class="status-dot"></span>${capitalizeFirst(status || 'Unknown')}`;
}

/**
 * Initialize sidebar
 */
function initializeSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.server-sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
}

/**
 * Initialize tabs
 */
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show target content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });
}

/**
 * Initialize power controls
 */
function initializePowerControls() {
    const startBtn = document.getElementById('btn-start');
    const restartBtn = document.getElementById('btn-restart');
    const stopBtn = document.getElementById('btn-stop');
    const killBtn = document.getElementById('btn-kill');
    
    if (startBtn) {
        startBtn.addEventListener('click', () => handlePowerAction('start'));
    }
    
    if (restartBtn) {
        restartBtn.addEventListener('click', () => handlePowerAction('restart'));
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', () => handlePowerAction('stop'));
    }
    
    if (killBtn) {
        killBtn.addEventListener('click', () => handlePowerAction('kill'));
    }
}

/**
 * Handle power action
 */
async function handlePowerAction(action) {
    const btn = document.getElementById(`btn-${action}`);
    const originalText = btn.innerHTML;
    
    showLoading(btn);
    
    try {
        let response;
        
        switch (action) {
            case 'start':
                response = await API.power.start(currentServerId);
                break;
            case 'restart':
                response = await API.power.restart(currentServerId);
                break;
            case 'stop':
                response = await API.power.stop(currentServerId);
                break;
            case 'kill':
                if (!confirm('Are you sure you want to kill the server?')) {
                    hideLoading(btn, originalText);
                    return;
                }
                response = await API.power.kill(currentServerId);
                break;
        }
        
        if (response.success) {
            showAlert(`Server ${action}ed successfully`, 'success');
            updateServerStatus(action === 'kill' ? 'offline' : action === 'stop' ? 'offline' : 'starting');
        } else {
            showAlert(response.error || `Failed to ${action} server`, 'error');
        }
    } catch (error) {
        showAlert('Unable to connect to the API', 'error');
    } finally {
        hideLoading(btn, originalText);
    }
}

/**
 * Initialize console
 */
function initializeConsole() {
    const consoleInput = document.getElementById('console-input');
    const consoleSend = document.getElementById('console-send');
    
    if (consoleSend && consoleInput) {
        consoleSend.addEventListener('click', sendConsoleCommand);
        consoleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendConsoleCommand();
            }
        });
    }
    
    // Start polling console logs
    loadConsoleLogs();
    consoleInterval = setInterval(loadConsoleLogs, 2000);
}

/**
 * Load console logs
 */
async function loadConsoleLogs() {
    const consoleOutput = document.getElementById('console-output');
    if (!consoleOutput) return;
    
    try {
        const response = await API.console.getLogs(currentServerId);
        
        if (response.success && response.data) {
            const logs = response.data;
            
            if (logs.length > 0) {
                const html = logs.map(log => `
                    <div class="console-line">
                        <span class="console-line-timestamp">[${log.timestamp || ''}]</span>
                        <span class="console-line-message">${escapeHtml(log.line || '')}</span>
                    </div>
                `).join('');
                
                consoleOutput.innerHTML = html;
                consoleOutput.scrollTop = consoleOutput.scrollHeight;
            }
        } else {
            consoleOutput.innerHTML = '<div class="console-line">Console unavailable</div>';
        }
    } catch (error) {
        consoleOutput.innerHTML = '<div class="console-line">Console unavailable</div>';
    }
}

/**
 * Send console command
 */
async function sendConsoleCommand() {
    const consoleInput = document.getElementById('console-input');
    const command = consoleInput.value.trim();
    
    if (!command) return;
    
    try {
        const response = await API.console.sendCommand(currentServerId, command);
        
        if (response.success) {
            consoleInput.value = '';
        } else {
            showAlert('Failed to send command', 'error');
        }
    } catch (error) {
        showAlert('Unable to send command', 'error');
    }
}

/**
 * Initialize resources
 */
function initializeResources() {
    loadResources();
    resourcesInterval = setInterval(loadResources, 5000);
}

/**
 * Load resources
 */
async function loadResources() {
    try {
        const response = await API.resources.getResources(currentServerId);
        
        if (response.success && response.data) {
            const resources = response.data;
            
            // Update CPU
            const cpuValue = document.getElementById('resource-cpu-value');
            const cpuBar = document.getElementById('resource-cpu-bar');
            if (cpuValue && resources.cpu !== undefined) {
                cpuValue.textContent = `${resources.cpu}%`;
                if (cpuBar) {
                    cpuBar.style.width = `${resources.cpu}%`;
                    cpuBar.className = 'resource-bar-fill' + (resources.cpu > 80 ? ' danger' : resources.cpu > 60 ? ' warning' : '');
                }
            }
            
            // Update RAM
            const ramValue = document.getElementById('resource-ram-value');
            const ramBar = document.getElementById('resource-ram-bar');
            if (ramValue && resources.memory !== undefined) {
                ramValue.textContent = formatBytes(resources.memory);
                if (ramBar && resources.maxMemory) {
                    const percentage = (resources.memory / resources.maxMemory) * 100;
                    ramBar.style.width = `${percentage}%`;
                    ramBar.className = 'resource-bar-fill' + (percentage > 80 ? ' danger' : percentage > 60 ? ' warning' : '');
                }
            }
            
            // Update Disk
            const diskValue = document.getElementById('resource-disk-value');
            const diskBar = document.getElementById('resource-disk-bar');
            if (diskValue && resources.disk !== undefined) {
                diskValue.textContent = formatBytes(resources.disk);
                if (diskBar && resources.maxDisk) {
                    const percentage = (resources.disk / resources.maxDisk) * 100;
                    diskBar.style.width = `${percentage}%`;
                    diskBar.className = 'resource-bar-fill' + (percentage > 80 ? ' danger' : percentage > 60 ? ' warning' : '');
                }
            }
        }
    } catch (error) {
        // Silently fail on resource updates
    }
}

/**
 * Initialize files
 */
async function initializeFiles() {
    loadFiles('/');
}

/**
 * Load files
 */
async function loadFiles(path = '/') {
    const fileList = document.getElementById('file-list');
    const filePath = document.getElementById('file-path');
    
    if (!fileList) return;
    
    if (filePath) {
        filePath.textContent = path;
    }
    
    try {
        const response = await API.files.listFiles(currentServerId, path);
        
        if (response.success && response.data) {
            renderFiles(response.data);
        } else {
            fileList.innerHTML = '<div class="empty-state">Unable to load files</div>';
        }
    } catch (error) {
        fileList.innerHTML = '<div class="empty-state">Unable to load files</div>';
    }
}

/**
 * Render files
 */
function renderFiles(files) {
    const fileList = document.getElementById('file-list');
    
    const html = files.map(file => `
        <div class="file-item" data-path="${escapeHtml(file.path)}" data-type="${file.type}">
            <div class="file-icon">${file.type === 'directory' ? '📁' : '📄'}</div>
            <div class="file-name">${escapeHtml(file.name)}</div>
            <div class="file-size">${file.type === 'directory' ? '—' : formatBytes(file.size || 0)}</div>
            <div class="file-date">${formatDate(file.modified || file.created)}</div>
        </div>
    `).join('');
    
    fileList.innerHTML = html;
}

/**
 * Initialize startup settings
 */
async function initializeStartup() {
    try {
        const response = await API.server.getServer(currentServerId);
        
        if (response.success && response.data) {
            const server = response.data;
            
            const startupCommand = document.getElementById('startup-command');
            if (startupCommand && server.startupCommand) {
                startupCommand.value = server.startupCommand;
            }
        }
    } catch (error) {
        // Silently fail
    }
}

/**
 * Initialize settings
 */
function initializeSettings() {
    const deleteBtn = document.getElementById('btn-delete-server');
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteServer);
    }
}

/**
 * Handle delete server
 */
async function handleDeleteServer() {
    if (!confirm('Are you sure you want to delete this server? This action cannot be undone.')) {
        return;
    }
    
    if (!confirm('This will permanently delete all server data. Continue?')) {
        return;
    }
    
    try {
        const response = await API.server.deleteServer(currentServerId);
        
        if (response.success) {
            showAlert('Server deleted successfully', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showAlert(response.error || 'Failed to delete server', 'error');
        }
    } catch (error) {
        showAlert('Unable to delete server', 'error');
    }
}

/**
 * Cleanup intervals on page unload
 */
window.addEventListener('beforeunload', () => {
    if (consoleInterval) {
        clearInterval(consoleInterval);
    }
    if (resourcesInterval) {
        clearInterval(resourcesInterval);
    }
});
