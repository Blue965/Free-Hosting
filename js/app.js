/**
 * Main Application Entry Point
 * Initializes the application and handles global functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeNavbar();
    initializeMobileMenu();
    initializeAuthState();
    initializeGlobalErrorHandling();
});

/**
 * Initialize navbar based on auth state
 */
function initializeNavbar() {
    const token = localStorage.getItem('auth_token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    const authLinks = document.querySelectorAll('.navbar-auth');
    const userLinks = document.querySelectorAll('.navbar-user');
    
    if (token && user) {
        authLinks.forEach(link => link.classList.add('hidden'));
        userLinks.forEach(link => link.classList.remove('hidden'));
        
        // Update username if element exists
        const usernameEl = document.getElementById('navbar-username');
        if (usernameEl) {
            usernameEl.textContent = user.username;
        }
    } else {
        authLinks.forEach(link => link.classList.remove('hidden'));
        userLinks.forEach(link => link.classList.add('hidden'));
    }
}

/**
 * Initialize mobile menu toggle
 */
function initializeMobileMenu() {
    const toggle = document.getElementById('navbar-toggle');
    const mobileMenu = document.getElementById('navbar-mobile');
    
    if (toggle && mobileMenu) {
        toggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!toggle.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('open');
            }
        });
    }
}

/**
 * Initialize authentication state
 */
function initializeAuthState() {
    // Check if token exists and is valid
    const token = localStorage.getItem('auth_token');
    
    if (token) {
        // Verify token with backend
        API.auth.getCurrentUser()
            .then(response => {
                if (!response.success) {
                    // Token invalid, clear auth
                    clearAuth();
                }
            })
            .catch(() => {
                // API unavailable, keep token for now
            });
    }
}

/**
 * Clear authentication
 */
function clearAuth() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    // Redirect to login if not already there
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('register.html')) {
        window.location.href = 'login.html';
    }
}

/**
 * Initialize global error handling
 */
function initializeGlobalErrorHandling() {
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
    });
    
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
    });
}

/**
 * Show loading state
 */
function showLoading(element) {
    if (element) {
        element.disabled = true;
        element.innerHTML = '<span class="spinner"></span> Loading...';
    }
}

/**
 * Hide loading state
 */
function hideLoading(element, originalText) {
    if (element) {
        element.disabled = false;
        element.innerHTML = originalText;
    }
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Insert at top of content
    const content = document.querySelector('.container, .dashboard-content, .server-content');
    if (content) {
        content.insertBefore(alert, content.firstChild);
    }
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format datetime
 */
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!localStorage.getItem('auth_token');
}

/**
 * Require authentication
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

/**
 * Redirect if authenticated
 */
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return true;
    }
    return false;
}
