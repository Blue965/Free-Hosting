/**
 * File Manager Module
 * Handles file upload, download, and management
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeFileUpload();
    initializeFileActions();
});

/**
 * Initialize file upload
 */
function initializeFileUpload() {
    const uploadBtn = document.getElementById('btn-upload');
    const fileInput = document.getElementById('file-input');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', handleFileUpload);
    }
}

/**
 * Handle file upload
 */
async function handleFileUpload(e) {
    const files = e.target.files;
    
    if (!files || files.length === 0) return;
    
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('path', '/');
    
    const uploadBtn = document.getElementById('btn-upload');
    const originalText = uploadBtn.innerHTML;
    
    showLoading(uploadBtn);
    
    try {
        const response = await API.files.uploadFile(currentServerId, formData);
        
        if (response.success) {
            showAlert('File uploaded successfully', 'success');
            loadFiles('/');
        } else {
            showAlert(response.error || 'Upload failed', 'error');
        }
    } catch (error) {
        showAlert('Unable to upload file', 'error');
    } finally {
        hideLoading(uploadBtn, originalText);
        e.target.value = '';
    }
}

/**
 * Initialize file actions
 */
function initializeFileActions() {
    const createFolderBtn = document.getElementById('btn-create-folder');
    
    if (createFolderBtn) {
        createFolderBtn.addEventListener('click', handleCreateFolder);
    }
}

/**
 * Handle create folder
 */
async function handleCreateFolder() {
    const folderName = prompt('Enter folder name:');
    
    if (!folderName) return;
    
    try {
        const response = await API.files.createDirectory(currentServerId, `/${folderName}`);
        
        if (response.success) {
            showAlert('Folder created successfully', 'success');
            loadFiles('/');
        } else {
            showAlert(response.error || 'Failed to create folder', 'error');
        }
    } catch (error) {
        showAlert('Unable to create folder', 'error');
    }
}
