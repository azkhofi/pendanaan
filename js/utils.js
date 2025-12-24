// Utility functions
const utils = {
  // Format currency
  formatCurrency: function (amount) {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  },

  // Format baru dengan input manual
  formatDate: function (dateString) {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  },

  // Format date for input (YYYY-MM-DD)
  formatDateForInput: function (dateString) {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "";
      }
      return date.toISOString().split("T")[0];
    } catch (e) {
      return "";
    }
  },

  // TAMBAHKAN fungsi helper untuk transaksi.js
  validateDate: function (day, month, year) {
    // Validasi tahun
    if (year < 2000 || year > 2100) return false;

    // Validasi bulan
    if (month < 0 || month > 11) return false;

    // Validasi hari berdasarkan bulan
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return day >= 1 && day <= daysInMonth;
  },

  // Show loading spinner
  showLoading: function (elementId = "content-area") {
    const element = document.getElementById(elementId);
    element.innerHTML = `
            <div class="spinner-container">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    element.style.animation = "fadeIn 0.3s ease";
  },

  // Show error message
  showError: function (message, elementId = "content-area") {
    const element = document.getElementById(elementId);
    element.innerHTML = `
            <div class="alert alert-danger animate__animated animate__fadeIn">
                <h4><i class="fas fa-exclamation-triangle me-2"></i>Error</h4>
                <p>${message}</p>
                <button onclick="showDashboard()" class="btn btn-primary">
                    <i class="fas fa-home me-2"></i>Kembali ke Dashboard
                </button>
            </div>
        `;
    element.style.animation = "fadeIn 0.3s ease";
  },

  // Show success message
  showSuccess: function (message) {
    // Remove existing alerts
    document
      .querySelectorAll(".alert-success")
      .forEach((alert) => alert.remove());

    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-success alert-dismissible fade show animate__animated animate__fadeInUp";
    alertDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    alertDiv.style.position = "fixed";
    alertDiv.style.top = "70px";
    alertDiv.style.right = "20px";
    alertDiv.style.zIndex = "1050";
    alertDiv.style.maxWidth = "400px";
    alertDiv.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";

    document.body.appendChild(alertDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.classList.remove("show");
        setTimeout(() => alertDiv.remove(), 150);
      }
    }, 5000);
  },

  // Show notification (toast)
  showNotification: function (title, message, type = "info") {
    const types = {
      info: { icon: "info-circle", class: "alert-info" },
      success: { icon: "check-circle", class: "alert-success" },
      warning: { icon: "exclamation-triangle", class: "alert-warning" },
      error: { icon: "times-circle", class: "alert-danger" },
    };

    const toast = document.createElement("div");
    toast.className = `alert ${types[type].class} alert-dismissible fade show animate__animated animate__fadeInRight`;
    toast.innerHTML = `
            <div class="d-flex">
                <div class="flex-shrink-0">
                    <i class="fas fa-${types[type].icon} fa-2x"></i>
                </div>
                <div class="flex-grow-1 ms-3">
                    <h6 class="mb-0">${title}</h6>
                    <small>${message}</small>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    toast.style.position = "fixed";
    toast.style.top = "80px";
    toast.style.right = "20px";
    toast.style.zIndex = "1050";
    toast.style.maxWidth = "350px";
    toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 150);
      }
    }, 5000);
  },

  // Download CSV
  downloadCSV: function (filename, data) {
    const csvContent = data
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Export to Excel (simple CSV)
  exportToExcel: function (data, headers, filename = "export.csv") {
    const csvData = [headers, ...data];
    this.downloadCSV(filename, csvData);
  },

  // Animate element
  animateElement: function (elementId, animationClass) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add("animate__animated", animationClass);
      setTimeout(() => {
        element.classList.remove("animate__animated", animationClass);
      }, 1000);
    }
  },

  // Scroll to top smoothly
  scrollToTop: function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  },

  // Format number with thousands separator
  formatNumber: function (num) {
    return new Intl.NumberFormat("id-ID").format(num);
  },

  // Truncate text
  truncateText: function (text, maxLength = 50) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  },
};

// Make utils available globally
window.utils = utils;
