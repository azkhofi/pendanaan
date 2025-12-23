// debug-drive.js - Tambahkan file ini untuk debugging
async function debugDriveAuth() {
    console.clear();
    console.log('=== Google Drive Auth Debug ===');
    
    // Check localStorage
    console.log('LocalStorage items:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('drive') || key.includes('google')) {
            console.log(`  ${key}:`, localStorage.getItem(key));
        }
    }
    
    // Check drive service
    console.log('Drive Service:', window.driveService);
    
    if (window.driveService) {
        console.log('Is authenticated:', window.driveService.isAuthenticated());
        console.log('Access token exists:', !!window.driveService.accessToken);
        
        // Test token if exists
        const token = localStorage.getItem('drive_access_token');
        if (token) {
            console.log('Testing token...');
            
            try {
                const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token);
                const data = await response.json();
                console.log('Token info:', data);
                
                if (data.error) {
                    console.error('Token is invalid:', data.error);
                    // Clear invalid token
                    localStorage.removeItem('drive_access_token');
                    localStorage.removeItem('drive_token_expiry');
                }
            } catch (error) {
                console.error('Token test failed:', error);
            }
        }
    }
    
    // Check OAuth configuration
    console.log('Current origin:', window.location.origin);
    console.log('Redirect URI configured:', window.driveService ? window.driveService.REDIRECT_URI : 'N/A');
}

// Fungsi untuk reset auth
function resetDriveAuth() {
    if (confirm('Reset all Google Drive authentication?')) {
        localStorage.clear();
        if (window.driveService) {
            window.driveService.clearTokens();
        }
        console.log('Auth reset complete');
        window.location.reload();
    }
}

// Tambahkan ke global
window.debugDriveAuth = debugDriveAuth;
window.resetDriveAuth = resetDriveAuth;

console.log('Drive debug functions loaded. Type debugDriveAuth() or resetDriveAuth() in console.');