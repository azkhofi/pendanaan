// Authentication module
const auth = {
  accessToken: null,
  tokenClient: null,
  TOKEN_KEY: 'token', // Nama token diubah menjadi "token"

  // Initialize OAuth2 Token Client
  init: function () {
    // Coba load token dari localStorage saat init
    this.loadTokenFromStorage();
    this.updateLoginUI();
    
    try {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.CLIENT_ID,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        callback: (response) => {
          if (response.access_token) {
            this.accessToken = response.access_token;
            // Simpan token ke localStorage dengan nama "token"
            this.saveTokenToStorage(response.access_token);
            this.updateLoginUI();
            utils.showSuccess(
              "Login berhasil! Sekarang Anda dapat menambah data."
            );
            this.refreshCurrentPage();
          } else {
            console.error("Login gagal:", response);
            alert("Login gagal atau dibatalkan.");
          }
        },
        error_callback: (error) => {
          console.error("OAuth error:", error);
          alert("Error login: " + error.message);
        },
      });
      console.log("Token client initialized");
    } catch (error) {
      console.error("Error initializing token client:", error);
    }
  },

  // Login function
  login: function () {
    if (!this.tokenClient) {
      this.init();
    }

    if (this.tokenClient) {
      // Request access token
      this.tokenClient.requestAccessToken();
    } else {
      alert("Token client belum diinisialisasi. Tunggu sebentar.");
    }
  },

  // Logout function
  logout: function () {
    if (this.accessToken) {
      google.accounts.oauth2.revoke(this.accessToken, () => {
        console.log("Access token revoked");
      });
    }

    this.accessToken = null;
    // Hapus token dari localStorage saat logout
    this.removeTokenFromStorage();
    this.updateLoginUI();
    alert("Anda telah logout. Hanya bisa melihat data.");
  },

  // Simpan token ke localStorage dengan nama "token"
  saveTokenToStorage: function (token) {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      console.log("Token saved to localStorage as 'token'");
    } catch (error) {
      console.error("Error saving token to localStorage:", error);
    }
  },

  // Load token dari localStorage dengan nama "token"
  loadTokenFromStorage: function () {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (token) {
        // Validasi token masih berlaku
        this.accessToken = token;
        console.log("Token 'token' loaded from localStorage");
        return true;
      }
    } catch (error) {
      console.error("Error loading token from localStorage:", error);
    }
    return false;
  },

  // Hapus token dari localStorage
  removeTokenFromStorage: function () {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      console.log("Token 'token' removed from localStorage");
    } catch (error) {
      console.error("Error removing token from localStorage:", error);
    }
  },

  // Periksa apakah token masih valid
  validateToken: function () {
    if (!this.accessToken) {
      return false;
    }
    
    // Di sini Anda bisa menambahkan validasi tambahan
    // Misalnya: memeriksa expiry time atau mengecek ke Google API
    return true;
  },

  // Auto login jika ada token tersimpan
  autoLoginIfTokenExists: function () {
    if (this.loadTokenFromStorage() && this.validateToken()) {
      console.log("Auto login dengan token tersimpan (token: 'token')");
      this.updateLoginUI();
      return true;
    }
    return false;
  },

  // Update UI setelah login
  updateLoginUI: function () {
    const loginStatus = document.getElementById("login-status");
    // Update desktop login UI
    if (this.isLoggedIn()) {
      loginStatus.classList.remove("d-none");
      document.getElementById("login-btn").style.display = "none";
      document.getElementById("login-status").style.display = "block";
    } else {
      document.getElementById("login-btn").style.display = "block";
      document.getElementById("login-status").style.display = "none";
    }

    // Update mobile bottom nav
    this.updateMobileAuthButtons();
  },

  // Update mobile auth buttons
  updateMobileAuthButtons: function () {
    const mobileLoginBtn = document.getElementById("mobile-login-btn");
    const mobileLogoutBtn = document.getElementById("mobile-logout-btn");

    if (mobileLoginBtn && mobileLogoutBtn) {
      if (this.isLoggedIn()) {
        mobileLoginBtn.style.display = "none";
        mobileLogoutBtn.style.display = "flex";
      } else {
        mobileLoginBtn.style.display = "flex";
        mobileLogoutBtn.style.display = "none";
      }
    }
  },

  // Refresh current page content
  refreshCurrentPage: function () {
    // Get current active nav
    const activeNav = document.querySelector(".nav-link.active");
    if (activeNav) {
      const navText = activeNav.textContent.trim();

      if (navText.includes("Dashboard")) {
        showDashboard();
      } else if (navText.includes("Transaksi")) {
        transaksi.showTransaksi();
      } else if (navText.includes("Kategori")) {
        master.showMaster("kategori");
      } else if (navText.includes("Setor")) {
        master.showMaster("setor");
      } else if (navText.includes("Keterangan")) {
        master.showMaster("keterangan");
      } else if (navText.includes("Laporan")) {
        laporan.showLaporan();
      }
    }
  },

  // Check if user is logged in
  isLoggedIn: function () {
    return this.accessToken !== null && this.validateToken();
  },

  // Fungsi helper untuk mendapatkan token (jika diperlukan di modul lain)
  getToken: function () {
    return this.accessToken;
  },

  // Fungsi untuk mengecek apakah token ada di localStorage (untuk debugging)
  hasStoredToken: function () {
    try {
      return localStorage.getItem(this.TOKEN_KEY) !== null;
    } catch (error) {
      return false;
    }
  }
};

// Make auth available globally
window.auth = auth;

// Panggil auto login saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
  auth.autoLoginIfTokenExists();
});

// Untuk debugging: bisa akses token dari console browser
// dengan mengetik: localStorage.getItem('token')