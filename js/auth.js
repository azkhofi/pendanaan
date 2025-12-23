// Authentication module
const auth = {
  accessToken: null,
  tokenClient: null,

  // Initialize OAuth2 Token Client
  init: function () {
    this.updateLoginUI();
    try {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.CLIENT_ID,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        callback: (response) => {
          if (response.access_token) {
            this.accessToken = response.access_token;
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
    this.updateLoginUI();
    alert("Anda telah logout. Hanya bisa melihat data.");
  },

  // Update UI setelah login
  updateLoginUI: function () {
    const loginStatus = document.getElementById("login-status");
    // Update desktop login UI
    if (this.accessToken) {
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
    return this.accessToken !== null;
  },
};

// Make auth available globally
window.auth = auth;
