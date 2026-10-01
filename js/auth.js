/**
 * Authentication Module
 * Handles login, register, and logout functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');
    const discordBtn = document.getElementById('discord-login');
    
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Discord login
    if (discordBtn) {
        discordBtn.addEventListener('click', handleDiscordLogin);
    }
});

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Clear previous errors
    clearFormErrors(form);
    
    // Validate
    if (!email || !password) {
        showFormError(form, 'Please fill in all fields');
        return;
    }
    
    // Show loading
    const originalText = submitBtn.innerHTML;
    showLoading(submitBtn);
    
    try {
        const response = await API.auth.login(email, password);
        
        if (response.success) {
            // Store token and user
            localStorage.setItem('auth_token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            showAlert('Login successful!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } else {
            showFormError(form, response.error || 'Login failed');
        }
    } catch (error) {
        showFormError(form, 'Unable to connect to the server');
    } finally {
        hideLoading(submitBtn, originalText);
    }
}

/**
 * Handle register form submission
 */
async function handleRegister(e) {
    e.preventDefault();
    
    const form = e.target;
    const username = form.username.value;
    const email = form.email.value;
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    const agreeTerms = form.agreeTerms.checked;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Clear previous errors
    clearFormErrors(form);
    
    // Validate
    if (!username || !email || !password || !confirmPassword) {
        showFormError(form, 'Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showFormError(form, 'Passwords do not match');
        return;
    }
    
    if (password.length < 8) {
        showFormError(form, 'Password must be at least 8 characters');
        return;
    }
    
    if (!agreeTerms) {
        showFormError(form, 'You must agree to the Terms of Service');
        return;
    }
    
    // Show loading
    const originalText = submitBtn.innerHTML;
    showLoading(submitBtn);
    
    try {
        const response = await API.auth.register(username, email, password);
        
        if (response.success) {
            // Store token and user
            localStorage.setItem('auth_token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            showAlert('Account created successfully!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } else {
            showFormError(form, response.error || 'Registration failed');
        }
    } catch (error) {
        showFormError(form, 'Authentication service unavailable. Please try again later.');
    } finally {
        hideLoading(submitBtn, originalText);
    }
}

/**
 * Handle logout
 */
async function handleLogout(e) {
    e.preventDefault();
    
    try {
        await API.auth.logout();
    } catch (error) {
        // Continue with logout even if API call fails
    }
    
    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    showAlert('Logged out successfully', 'success');
    
    // Redirect to home
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

/**
 * Handle Discord login
 */
function handleDiscordLogin(e) {
    e.preventDefault();
    API.auth.discordLogin();
}

/**
 * Show form error
 */
function showFormError(form, message) {
    // Remove existing error
    const existingError = form.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error element
    const error = document.createElement('div');
    error.className = 'alert alert-error';
    error.textContent = message;
    
    // Insert after form
    form.parentNode.insertBefore(error, form.nextSibling);
}

/**
 * Clear form errors
 */
function clearFormErrors(form) {
    const errors = form.parentNode.querySelectorAll('.alert-error');
    errors.forEach(error => error.remove());
}
