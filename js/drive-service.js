// drive-service.js - Versi Fixed
class DriveService {
    constructor() {
        this.CLIENT_ID = '1046860692698-4ji8ec2m9pcoierugui2t8rtnps2g635.apps.googleusercontent.com';
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
        // this.REDIRECT_URI = window.location.origin + '/index.html';
        this.REDIRECT_URI = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/') + 'oauth2callback.html';
        // this.REDIRECT_URI = 'http://127.0.0.1:5500/oauth2callback.html';
        // this.REDIRECT_URI = 'http://127.0.0.1:5500/oauth2callback.html';
        this.accessToken = null;
        this.folderId = null;
        this.isInitialized = false;
        
        // Listener untuk auth messages
        this.setupMessageListener();
    }

    // Setup message listener untuk popup communication
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            // Only accept messages from our domain
            if (event.origin !== window.location.origin) return;
            
            if (event.data.type === 'google_auth_token') {
                console.log('Received token from popup:', event.data);
                
                if (event.data.token) {
                    this.handleAuthSuccess(event.data.token, event.data.expires_in);
                } else if (event.data.error) {
                    console.error('Auth error from popup:', event.data.error);
                }
            }
        });
    }

    // Initialize the service
    async init() {
        if (this.isInitialized) return true;
        
        // Check for token in URL (if coming back from OAuth)
        const token = this.getTokenFromURL();
        if (token) {
            this.handleAuthSuccess(token.access_token, token.expires_in);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        // Check localStorage for existing token
        const storedToken = localStorage.getItem('drive_access_token');
        const tokenExpiry = localStorage.getItem('drive_token_expiry');
        
        if (storedToken && tokenExpiry) {
            const now = Date.now();
            if (now < parseInt(tokenExpiry)) {
                this.accessToken = storedToken;
                this.isInitialized = true;
                console.log('Using stored token');
                return true;
            } else {
                console.log('Token expired, removing...');
                this.clearTokens();
            }
        }
        
        return false;
    }

    // Get token from URL (OAuth callback)
    getTokenFromURL() {
        const hash = window.location.hash.substring(1);
        if (!hash) return null;
        
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const expires_in = params.get('expires_in');
        const error = params.get('error');
        
        if (error) {
            console.error('OAuth error:', params.get('error_description'));
            return null;
        }
        
        if (access_token) {
            return {
                access_token,
                expires_in: parseInt(expires_in) || 3600
            };
        }
        
        return null;
    }

    // Handle successful authentication
    handleAuthSuccess(accessToken, expiresIn = 3600) {
        this.accessToken = accessToken;
        this.isInitialized = true;
        
        // Calculate expiry (1 hour by default)
        const expiryTime = Date.now() + (expiresIn * 1000) - 60000; // Subtract 1 minute for safety
        
        // Store in localStorage
        localStorage.setItem('drive_access_token', accessToken);
        localStorage.setItem('drive_token_expiry', expiryTime.toString());
        
        console.log('Authentication successful, token stored');
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('drive-auth-change', {
            detail: { authenticated: true }
        }));
    }

    // Start authentication flow
    async authenticate() {
        return new Promise((resolve, reject) => {
            // Generate OAuth URL
            const authUrl = this.generateOAuthURL();
            
            // Open popup window
            const popupWidth = 600;
            const popupHeight = 700;
            const left = (window.screen.width - popupWidth) / 2;
            const top = (window.screen.height - popupHeight) / 2;
            
            const popup = window.open(
                authUrl,
                'google_auth',
                `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
            );
            
            if (!popup) {
                reject(new Error('Popup blocked. Please allow popups for this site.'));
                return;
            }
            
            // Poll for popup closure
            const popupCheck = setInterval(() => {
                if (popup.closed) {
                    clearInterval(popupCheck);
                    
                    // Check if we got a token
                    if (this.accessToken) {
                        resolve(this.accessToken);
                    } else {
                        reject(new Error('Authentication cancelled or failed'));
                    }
                }
            }, 500);
            
            // Timeout after 2 minutes
            setTimeout(() => {
                if (!popup.closed) {
                    popup.close();
                    clearInterval(popupCheck);
                    reject(new Error('Authentication timeout'));
                }
            }, 120000);
        });
    }

    // Generate OAuth URL
    generateOAuthURL() {
        const params = new URLSearchParams({
            client_id: this.CLIENT_ID,
            redirect_uri: this.REDIRECT_URI,
            response_type: 'token',
            scope: this.SCOPES,
            state: 'drive_auth_' + Date.now(),
            include_granted_scopes: 'true',
            prompt: 'consent',
            access_type: 'online'
        });
        
        return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
    }

    // Get valid access token
    async getAccessToken() {
        if (!this.accessToken) {
            const initialized = await this.init();
            if (!initialized) {
                throw new Error('Not authenticated. Please authenticate first.');
            }
        }
        
        // Check if token is expired
        const expiry = localStorage.getItem('drive_token_expiry');
        if (expiry && Date.now() >= parseInt(expiry)) {
            console.log('Token expired, requiring re-authentication');
            this.clearTokens();
            throw new Error('Token expired. Please re-authenticate.');
        }
        
        return this.accessToken;
    }

    // Get or create folder
    async getOrCreateFolder(folderName = 'Bukti Setoran Dana') {
        try {
            const token = await this.getAccessToken();
            
            // Search for existing folder
            const searchResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                }
            );
            
            const searchData = await searchResponse.json();
            
            if (searchData.files && searchData.files.length > 0) {
                this.folderId = searchData.files[0].id;
                return this.folderId;
            }
            
            // Create new folder
            const folderMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            };
            
            const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(folderMetadata)
            });
            
            const createData = await createResponse.json();
            this.folderId = createData.id;
            
            // Set folder permissions
            await this.setPermissions(this.folderId, token);
            
            return this.folderId;
            
        } catch (error) {
            console.error('Error getting/creating folder:', error);
            throw error;
        }
    }

    // Upload file to Drive
    async uploadFile(file) {
        try {
            const token = await this.getAccessToken();
            const folderId = await this.getOrCreateFolder();
            
            // Create file metadata
            const metadata = {
                name: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
                parents: [folderId]
            };
            
            // Create FormData
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { 
                type: 'application/json' 
            }));
            form.append('file', file);
            
            // Upload with progress tracking
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink');
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                
                // Track upload progress
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = (event.loaded / event.total) * 100;
                        console.log(`Upload: ${percent.toFixed(2)}%`);
                        
                        // Update UI if element exists
                        const progressElement = document.getElementById('upload-progress');
                        if (progressElement) {
                            progressElement.textContent = `${Math.round(percent)}%`;
                        }
                    }
                };
                
                xhr.onload = async () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const result = JSON.parse(xhr.responseText);
                            
                            // Set file permissions
                            await this.setPermissions(result.id, token);
                            
                            // Return viewable link
                            resolve(result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`);
                            
                        } catch (parseError) {
                            reject(new Error('Invalid response from server'));
                        }
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`));
                    }
                };
                
                xhr.onerror = () => {
                    reject(new Error('Network error during upload'));
                };
                
                xhr.send(form);
            });
            
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    // Set permissions to public
    async setPermissions(fileId, token) {
        try {
            const permission = {
                role: 'reader',
                type: 'anyone'
            };
            
            await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(permission)
            });
            
        } catch (error) {
            console.warn('Failed to set permissions (non-critical):', error);
        }
    }

    // Check authentication status
    isAuthenticated() {
        const token = localStorage.getItem('drive_access_token');
        const expiry = localStorage.getItem('drive_token_expiry');
        
        if (!token || !expiry) return false;
        
        return Date.now() < parseInt(expiry);
    }

    // Clear all tokens
    clearTokens() {
        localStorage.removeItem('drive_access_token');
        localStorage.removeItem('drive_token_expiry');
        this.accessToken = null;
        this.isInitialized = false;
        
        window.dispatchEvent(new CustomEvent('drive-auth-change', {
            detail: { authenticated: false }
        }));
    }

    // Sign out
    signOut() {
        const token = localStorage.getItem('drive_access_token');
        
        if (token) {
            // Try to revoke token
            fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
                method: 'POST'
            }).catch(() => {
                // Ignore revocation errors
            });
        }
        
        this.clearTokens();
        console.log('Signed out from Google Drive');
    }

    // Get authentication status for UI
    getAuthStatus() {
        if (this.isAuthenticated()) {
            return {
                authenticated: true,
                message: 'Google Drive Connected ✓',
                class: 'success'
            };
        } else {
            return {
                authenticated: false,
                message: 'Connect Google Drive to upload files',
                class: 'warning'
            };
        }
    }
}

// Create and initialize global instance
let driveService = null;

async function initDriveService() {
    if (!driveService) {
        driveService = new DriveService();
        await driveService.init();
    }
    return driveService;
}

// Make available globally
window.initDriveService = initDriveService;

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.driveService = await initDriveService();
        console.log('Drive service initialized');
    } catch (error) {
        console.error('Failed to initialize drive service:', error);
    }
});