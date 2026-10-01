/**
 * API Abstraction Layer
 * Handles all backend API calls
 * Never exposes Wisp.gg API keys directly
 */

class APIResponse {
    constructor(success, data, error = null) {
        this.success = success;
        this.data = data;
        this.error = error;
    }
}

/**
 * Make an authenticated request to the backend
 */
async function authenticatedRequest(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(`/api${endpoint}`, {
            ...options,
            headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            return new APIResponse(false, null, data.error || 'Request failed');
        }
        
        return new APIResponse(true, data);
    } catch (error) {
        return new APIResponse(false, null, error.message);
    }
}

/**
 * Authentication API
 */
const authAPI = {
    async login(email, password) {
        return authenticatedRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },
    
    async register(username, email, password) {
        return authenticatedRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    },
    
    async logout() {
        return authenticatedRequest('/auth/logout', {
            method: 'POST'
        });
    },
    
    async me() {
        return authenticatedRequest('/auth/me');
    },
    
    async discordLogin() {
        window.location.href = '/api/auth/discord';
    }
};

/**
 * User API
 */
const userAPI = {
    async getProfile() {
        return authenticatedRequest('/user/profile');
    },
    
    async updateProfile(data) {
        return authenticatedRequest('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async changePassword(currentPassword, newPassword) {
        return authenticatedRequest('/user/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    },
    
    async getSessions() {
        return authenticatedRequest('/user/sessions');
    },
    
    async revokeSession(sessionId) {
        return authenticatedRequest(`/user/sessions/${sessionId}`, {
            method: 'DELETE'
        });
    },
    
    async revokeAllSessions() {
        return authenticatedRequest('/user/sessions', {
            method: 'DELETE'
        });
    }
};

/**
 * Server API (Wisp.gg)
 */
const serverAPI = {
    async getServers() {
        return authenticatedRequest('/servers');
    },
    
    async getServer(id) {
        return authenticatedRequest(`/servers/${id}`);
    },
    
    async createServer(data) {
        return authenticatedRequest('/servers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async deleteServer(id) {
        return authenticatedRequest(`/servers/${id}`, {
            method: 'DELETE'
        });
    },
    
    async renameServer(id, name) {
        return authenticatedRequest(`/servers/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ name })
        });
    },
    
    async reinstallServer(id) {
        return authenticatedRequest(`/servers/${id}/reinstall`, {
            method: 'POST'
        });
    }
};

/**
 * Power API (Wisp.gg)
 */
const powerAPI = {
    async start(id) {
        return authenticatedRequest(`/servers/${id}/power`, {
            method: 'POST',
            body: JSON.stringify({ action: 'start' })
        });
    },
    
    async stop(id) {
        return authenticatedRequest(`/servers/${id}/power`, {
            method: 'POST',
            body: JSON.stringify({ action: 'stop' })
        });
    },
    
    async restart(id) {
        return authenticatedRequest(`/servers/${id}/power`, {
            method: 'POST',
            body: JSON.stringify({ action: 'restart' })
        });
    },
    
    async kill(id) {
        return authenticatedRequest(`/servers/${id}/power`, {
            method: 'POST',
            body: JSON.stringify({ action: 'kill' })
        });
    }
};

/**
 * Console API (Wisp.gg)
 */
const consoleAPI = {
    async getLogs(id) {
        return authenticatedRequest(`/servers/${id}/console`);
    },
    
    async sendCommand(id, command) {
        return authenticatedRequest(`/servers/${id}/console`, {
            method: 'POST',
            body: JSON.stringify({ command })
        });
    }
};

/**
 * Resources API (Wisp.gg)
 */
const resourcesAPI = {
    async getResources(id) {
        return authenticatedRequest(`/servers/${id}/resources`);
    }
};

/**
 * Files API (Wisp.gg)
 */
const filesAPI = {
    async listFiles(id, path = '/') {
        return authenticatedRequest(`/servers/${id}/files?path=${encodeURIComponent(path)}`);
    },
    
    async getFileContent(id, path) {
        return authenticatedRequest(`/servers/${id}/files/content?path=${encodeURIComponent(path)}`);
    },
    
    async createFile(id, path, content) {
        return authenticatedRequest(`/servers/${id}/files`, {
            method: 'POST',
            body: JSON.stringify({ path, content })
        });
    },
    
    async updateFile(id, path, content) {
        return authenticatedRequest(`/servers/${id}/files`, {
            method: 'PUT',
            body: JSON.stringify({ path, content })
        });
    },
    
    async deleteFile(id, path) {
        return authenticatedRequest(`/servers/${id}/files`, {
            method: 'DELETE',
            body: JSON.stringify({ path })
        });
    },
    
    async renameFile(id, oldPath, newPath) {
        return authenticatedRequest(`/servers/${id}/files/rename`, {
            method: 'POST',
            body: JSON.stringify({ oldPath, newPath })
        });
    },
    
    async createDirectory(id, path) {
        return authenticatedRequest(`/servers/${id}/files/directory`, {
            method: 'POST',
            body: JSON.stringify({ path })
        });
    },
    
    async uploadFile(id, file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const token = localStorage.getItem('authToken');
        
        try {
            const response = await fetch(`/api/servers/${id}/files/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                return new APIResponse(false, null, data.error || 'Upload failed');
            }
            
            return new APIResponse(true, data);
        } catch (error) {
            return new APIResponse(false, null, error.message);
        }
    },
    
    async downloadFile(id, path) {
        const token = localStorage.getItem('authToken');
        
        try {
            const response = await fetch(`/api/servers/${id}/files/download?path=${encodeURIComponent(path)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                return new APIResponse(false, null, 'Download failed');
            }
            
            const blob = await response.blob();
            return new APIResponse(true, blob);
        } catch (error) {
            return new APIResponse(false, null, error.message);
        }
    }
};

/**
 * Status API
 */
const statusAPI = {
    async getStatus() {
        return authenticatedRequest('/status');
    },
    
    async getIncidents() {
        return authenticatedRequest('/status/incidents');
    }
};

// Export API object
const API = {
    auth: authAPI,
    user: userAPI,
    server: serverAPI,
    power: powerAPI,
    console: consoleAPI,
    resources: resourcesAPI,
    files: filesAPI,
    status: statusAPI
};
