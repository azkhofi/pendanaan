// transaksi.js - Versi Sempurna
const transaksi = {
  // Constructor-like function
  init: function () {
    // Bind methods to maintain 'this' context
    this.showTransaksi = this.showTransaksi.bind(this);
    this.loadTransaksiList = this.loadTransaksiList.bind(this);
    this.submitTransaksi = this.submitTransaksi.bind(this);
    this.handleFileSelect = this.handleFileSelect.bind(this);
    this.initDriveUI = this.initDriveUI.bind(this);
    this.connectDrive = this.connectDrive.bind(this);
    this.disconnectDrive = this.disconnectDrive.bind(this);
    this.removeFile = this.removeFile.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.copyLink = this.copyLink.bind(this);
    this.formatFileSize = this.formatFileSize.bind(this);

    // Setup event listeners
    this.setupEventListeners();

    return this;
  },

  // Tambahkan ini untuk config tanggal
  dateConfig: {
    manualInput: false, // Flag untuk mode manual
    currentDate: null, // Untuk menyimpan tanggal yang dipilih
  },

  // Setup event listeners for auth
  setupEventListeners: function () {
    // Listen for auth completion when page loads
    window.addEventListener("load", () => {
      // Cek jika auth baru selesai (dari redirect)
      if (localStorage.getItem("drive_auth_complete") === "true") {
        localStorage.removeItem("drive_auth_complete");

        // Delay sedikit untuk memastikan token tersimpan
        setTimeout(() => {
          this.initDriveUI();
          utils.showSuccess("Google Drive connected successfully!");
        }, 500);
      }
    });

    // Listen for messages from popup
    window.addEventListener("message", (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "drive_auth_token" && event.data.access_token) {
        console.log("Received token from popup");

        if (window.driveService) {
          window.driveService.handleAuthSuccess(
            event.data.access_token,
            event.data.expires_in
          );
          this.initDriveUI();
          utils.showSuccess("Google Drive connected successfully!");
        }
      }
    });

    // Listen for custom event
    window.addEventListener("drive-auth-success", () => {
      this.initDriveUI();
    });
  },

  // Show transaction form
  showTransaksi: async function () {
    setActiveNav("transaksi.showTransaksi");

    try {
      const [kategori, setor, keterangan] = await Promise.all([
        api.fetchData(`${CONFIG.SHEETS.MASTER_KATEGORI}!A2:A`),
        api.fetchData(`${CONFIG.SHEETS.MASTER_SETOR}!A2:A`),
        api.fetchData(`${CONFIG.SHEETS.MASTER_KETERANGAN}!A2:A`),
      ]);

      const content = `
                <h2 class="mb-4"><i class="fas fa-money-bill-wave me-2"></i>Tambah Transaksi Dana</h2>
                
                <!-- Google Drive Status -->
                <div id="drive-status" class="alert">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="fab fa-google-drive me-2"></i>
                            <span id="drive-status-text">Checking Google Drive connection...</span>
                        </div>
                        <div id="drive-actions">
                            <!-- Buttons will be added by JavaScript -->
                        </div>
                    </div>
                </div>
                
                ${
                  !auth.isLoggedIn()
                    ? '<div class="alert alert-warning">Anda harus login untuk menambah data transaksi</div>'
                    : ""
                }
                
                <div class="card">
                    <div class="card-body">
                        <form id="transaksi-form">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="namaDonatur" class="form-label required">Nama Donatur</label>
                                    <input type="text" class="form-control" id="namaDonatur" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="kategori" class="form-label required">Kategori</label>
                                    <select class="form-select" id="kategori" required>
                                        <option value="">Pilih Kategori</option>
                                        ${kategori
                                          .filter(Boolean)
                                          .map(
                                            (item) =>
                                              `<option value="${item[0]}">${item[0]}</option>`
                                          )
                                          .join("")}
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row">
    <div class="col-md-6 mb-3">
        <label for="nominal" class="form-label required">Nominal (Rp)</label>
        <div class="input-group">
            <span class="input-group-text">Rp</span>
            <input 
                type="text" 
                class="form-control" 
                id="nominal" 
                required
                placeholder="0"
                data-raw-value=""
            >
        </div>
        <div class="form-text">Format akan otomatis diterapkan</div>
    </div>
    <div class="col-md-6 mb-3">
        <label for="penerima" class="form-label required">Penerima</label>
        <input type="text" class="form-control" id="penerima" required>
    </div>
</div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="setor" class="form-label required">Bentuk Setoran</label>
                                    <select class="form-select" id="setor" required>
                                        <option value="">Pilih Setoran</option>
                                        ${setor
                                          .filter(Boolean)
                                          .map(
                                            (item) =>
                                              `<option value="${item[0]}">${item[0]}</option>`
                                          )
                                          .join("")}
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="keterangan" class="form-label required">Keterangan Transaksi</label>
                                    <select class="form-select" id="keterangan" required>
                                        <option value="">Pilih Keterangan</option>
                                        ${keterangan
                                          .filter(Boolean)
                                          .map(
                                            (item) =>
                                              `<option value="${item[0]}">${item[0]}</option>`
                                          )
                                          .join("")}
                                    </select>
                                </div>
                            </div>
                            
                            <!---add input manual date--->
                            <div class="row mt-2">
    <div class="col-md-6 mb-3">
        <label for="date-toggle" class="form-label">
            <i class="fas fa-calendar-alt me-1"></i>Pengaturan Tanggal
        </label>
        <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="date-toggle" 
                   onchange="transaksi.toggleManualDate()">
            <label class="form-check-label" for="date-toggle">
                Gunakan Tanggal Manual
            </label>
        </div>
    </div>
</div>

<!-- Form input tanggal manual (hidden by default) -->
<div id="manual-date-form" class="row mb-4" style="display: none;">
    <div class="col-12">
        <div class="card border-primary">
            <div class="card-header bg-primary text-white">
                <i class="fas fa-calendar-plus me-2"></i>Input Tanggal Manual
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-3">
                        <label class="form-label">Tanggal *</label>
                        <input type="number" class="form-control" id="manual-day" 
                               min="1" max="31" value="${new Date().getDate()}" 
                               placeholder="DD" required>
                    </div>
                    
                    <div class="col-md-3">
                        <label class="form-label">Bulan *</label>
                        <select class="form-select" id="manual-month" required>
                            <option value="">Pilih Bulan</option>
                            ${(() => {
                              const currentMonth = new Date().getMonth();
                              const months = [
                                "Januari",
                                "Februari",
                                "Maret",
                                "April",
                                "Mei",
                                "Juni",
                                "Juli",
                                "Agustus",
                                "September",
                                "Oktober",
                                "November",
                                "Desember",
                              ];
                              return months
                                .map(
                                  (month, index) =>
                                    `<option value="${index}" ${
                                      index === currentMonth ? "selected" : ""
                                    }>
                                        ${month}
                                    </option>`
                                )
                                .join("");
                            })()}
                        </select>
                    </div>
                    
                    <div class="col-md-3">
                        <label class="form-label">Tahun *</label>
                        <input type="number" class="form-control" id="manual-year" 
                               min="2000" max="2100" value="${new Date().getFullYear()}" 
                               placeholder="YYYY" required>
                    </div>
                    
                    <div class="col-md-3">
                        <label class="form-label">Waktu</label>
                        <div class="input-group">
                            <input type="number" class="form-control" id="manual-hour" 
                                   min="0" max="23" value="${new Date().getHours()}" 
                                   placeholder="HH">
                            <span class="input-group-text">:</span>
                            <input type="number" class="form-control" id="manual-minute" 
                                   min="0" max="59" value="${new Date().getMinutes()}" 
                                   placeholder="MM">
                        </div>
                        <div class="form-text">Jam (0-23):Menit</div>
                    </div>
                    
                    <div class="col-12 mt-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <small class="text-muted">
                                    Tanggal otomatis: ${new Date().toLocaleDateString(
                                      "id-ID"
                                    )}
                                </small>
                            </div>
                            <div>
                                <button type="button" class="btn btn-sm btn-outline-primary me-2" 
                                        onclick="transaksi.setManualDate()">
                                    <i class="fas fa-check me-1"></i>Terapkan Tanggal
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-secondary" 
                                        onclick="transaksi.cancelManualDate()">
                                    <i class="fas fa-times me-1"></i>Batal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Status tanggal -->
<div id="date-status" class="alert alert-info mb-3" style="display: none;">
    <i class="fas fa-info-circle me-2"></i>
    <span id="date-status-text"></span>
</div>

<div class="row mt-3">

                            <!-- File Upload Section -->
                            <div class="row mt-3">
                                <div class="col-md-12 mb-3">
                                    <label for="buktiFile" class="form-label">
                                        <i class="fas fa-file-upload me-1"></i>Bukti Setoran
                                    </label>
                                    <div class="input-group">
                                        <input type="file" class="form-control" id="buktiFile" 
                                               accept="image/*,.pdf,.doc,.docx,.xls,.xlsx">
                                        <button type="button" class="btn btn-outline-secondary" onclick="transaksi.removeFile()" title="Clear">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                    <div id="file-help" class="form-text">
                                        Unggah bukti setoran (Foto, PDF, DOC - maks 10MB)
                                    </div>
                                    
                                    <!-- File Preview -->
                                    <div id="preview-container" class="mt-2" style="display: none;">
                                        <div class="card border-primary">
                                            <div class="card-body p-3">
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <i class="fas fa-file text-primary me-2"></i>
                                                        <span id="file-name" class="fw-bold"></span>
                                                        <small id="file-size" class="text-muted ms-2"></small>
                                                    </div>
                                                    <div>
                                                        <span id="upload-progress" class="badge bg-info me-2" style="display: none;">
                                                            <i class="fas fa-spinner fa-spin me-1"></i><span>0%</span>
                                                        </span>
                                                        <button type="button" class="btn btn-sm btn-danger" onclick="transaksi.removeFile()" title="Remove file">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div id="preview-image" class="mt-3 text-center" style="display: none;">
                                                    <img src="" alt="Preview" class="img-thumbnail" style="max-height: 150px;">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Upload Status Messages -->
                            <div id="upload-status" class="alert" style="display: none;"></div>
                            
                            <div class="d-flex gap-2 mt-3">
                                <button type="button" onclick="transaksi.submitTransaksi()" 
                                        class="btn btn-primary btn-lg" 
                                        ${!auth.isLoggedIn() ? "disabled" : ""}>
                                    <i class="fas fa-save me-2"></i>Simpan Transaksi
                                </button>
                                <button type="button" class="btn btn-secondary btn-lg" onclick="transaksi.resetForm()">
                                    <i class="fas fa-redo me-2"></i>Reset Form
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Recent Transactions Table -->
                <div class="card mt-4">
                    <div class="card-header">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">
                                <i class="fas fa-history me-2"></i>Daftar Transaksi Terbaru
                            </h5>
                            <button onclick="transaksi.loadTransaksiList()" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-sync-alt me-1"></i>Refresh
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Donatur</th>
                                        <th>Kategori</th>
                                        <th>Nominal</th>
                                        <th>Penerima</th>
                                        <th>Setoran</th>
                                        <th>Keterangan</th>
                                        <th>Bukti</th>
                                    </tr>
                                </thead>
                                <tbody id="transaksi-list">
                                    <tr><td colspan="8" class="text-center">Loading...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

      document.getElementById("content-area").innerHTML = content;

      // Initialize nominal formatting
      this.formatNominalInput();

      // Toggle manual date input
      this.toggleManualDate = function () {
        const toggle = document.getElementById("date-toggle");
        const form = document.getElementById("manual-date-form");
        const status = document.getElementById("date-status");
        const statusText = document.getElementById("date-status-text");

        if (toggle.checked) {
          form.style.display = "block";
          status.style.display = "block";
          statusText.textContent =
            "Mode tanggal manual aktif. Silakan atur tanggal di atas.";
        } else {
          form.style.display = "none";
          status.style.display = "none";
          this.dateConfig.manualInput = false;
          this.dateConfig.currentDate = null;
        }
      };

      // Set manual date
      this.setManualDate = function () {
        const day = parseInt(document.getElementById("manual-day").value);
        const month = parseInt(document.getElementById("manual-month").value);
        const year = parseInt(document.getElementById("manual-year").value);
        const hour =
          parseInt(document.getElementById("manual-hour").value) || 0;
        const minute =
          parseInt(document.getElementById("manual-minute").value) || 0;

        // Validasi input
        if (!day || !month || month === "" || !year) {
          utils.showError("Harap isi Tanggal, Bulan, dan Tahun!");
          return;
        }

        // Validasi tanggal
        if (year < 2000 || year > 2100) {
          utils.showError("Tahun harus antara 2000 dan 2100");
          return;
        }

        if (month < 0 || month > 11) {
          utils.showError("Bulan tidak valid");
          return;
        }

        // Validasi hari berdasarkan bulan
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        if (day < 1 || day > daysInMonth) {
          utils.showError(
            `Tanggal harus antara 1 dan ${daysInMonth} untuk bulan ini`
          );
          return;
        }

        // Validasi jam dan menit
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
          utils.showError("Jam (0-23) dan Menit (0-59) harus valid");
          return;
        }

        // Buat objek Date
        const manualDate = new Date(year, month, day, hour, minute);

        // Simpan ke config
        this.dateConfig.currentDate = manualDate;
        this.dateConfig.manualInput = true;

        // Update status
        const statusText = document.getElementById("date-status-text");
        if (statusText) {
          const formattedDate = manualDate.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          statusText.textContent = `Tanggal diset ke: ${formattedDate}`;
          statusText.innerHTML += ` <button class="btn btn-sm btn-outline-danger ms-2" onclick="transaksi.resetManualDate()">
                                    <i class="fas fa-undo me-1"></i>Reset ke Tanggal Sekarang
                                  </button>`;
        }

        utils.showSuccess(
          `Tanggal berhasil diset: ${manualDate.toLocaleDateString("id-ID")}`
        );
      };

      // Cancel manual date
      this.cancelManualDate = function () {
        const toggle = document.getElementById("date-toggle");
        const form = document.getElementById("manual-date-form");
        const status = document.getElementById("date-status");

        toggle.checked = false;
        form.style.display = "none";
        status.style.display = "none";

        this.dateConfig.manualInput = false;
        this.dateConfig.currentDate = null;

         utils.showNotification(
        'Pengaturan Tanggal', 
        'Pengaturan tanggal dibatalkan, menggunakan tanggal otomatis', 
        'info'
        );
      };

      // Reset to current date
      this.resetManualDate = function () {
        const now = new Date();

        // Reset form inputs
        document.getElementById("manual-day").value = now.getDate();
        document.getElementById("manual-month").value = now.getMonth();
        document.getElementById("manual-year").value = now.getFullYear();
        document.getElementById("manual-hour").value = now.getHours();
        document.getElementById("manual-minute").value = now.getMinutes();

        // Reset config
        this.dateConfig.manualInput = false;
        this.dateConfig.currentDate = null;

        // Update status
        const statusText = document.getElementById("date-status-text");
        if (statusText) {
          statusText.textContent = "Menggunakan tanggal otomatis (saat ini)";
        }

         utils.showSuccess('Tanggal direset ke waktu sekarang');
      };

      // Get current date for submission (modifikasi fungsi submitTransaksi)

      // Initialize Drive service and update UI
      await this.initDriveUI();

      // Setup file input listener
      const fileInput = document.getElementById("buktiFile");
      if (fileInput) {
        fileInput.addEventListener("change", (e) => {
          this.handleFileSelect(e);
        });
      }

      // Load transaction list
      await this.loadTransaksiList();
    } catch (error) {
      console.error("Error loading transaction form:", error);
      utils.showError(`Error loading: ${error.message}`);
    }
  },

  // Load transaction list
  loadTransaksiList: async function () {
    try {
      const data = await api.fetchData(`${CONFIG.SHEETS.DANA}!A2:H`);

      if (data.length > 0) {
        const html = data
          .slice(-50)
          .reverse()
          .map(
            (row) => `
                    <tr>
                        <td>${utils.formatDate(row[0])}</td>
                        <td>${row[1] || "-"}</td>
                        <td><span class="badge bg-primary">${
                          row[2] || "-"
                        }</span></td>
                        <td><strong>${utils.formatCurrency(
                          row[3]
                        )}</strong></td>
                        <td>${row[4] || "-"}</td>
                        <td><span class="badge bg-secondary">${
                          row[5] || "-"
                        }</span></td>
                        <td>${utils.truncateText(row[6] || "-", 30)}</td>
                        <td>
                            ${
                              row[7]
                                ? `<div class="btn-group">
                                      <a href="${row[7]}" target="_blank" class="btn btn-sm btn-outline-info" title="Lihat bukti">
                                          <i class="fas fa-eye"></i>
                                      </a>
                                      <button type="button" class="btn btn-sm btn-outline-secondary" onclick="transaksi.copyLink('${row[7]}')" title="Salin link">
                                          <i class="fas fa-copy"></i>
                                      </button>
                                   </div>`
                                : '<span class="text-muted">-</span>'
                            }
                        </td>
                    </tr>
                `
          )
          .join("");

        document.getElementById("transaksi-list").innerHTML = html;
      } else {
        document.getElementById("transaksi-list").innerHTML =
          '<tr><td colspan="8" class="text-center text-muted py-4"><i class="fas fa-inbox fa-2x mb-2 d-block"></i>Belum ada data transaksi</td></tr>';
      }
    } catch (error) {
      console.error("Error loading transaction list:", error);
      document.getElementById("transaksi-list").innerHTML =
        '<tr><td colspan="8" class="text-center text-danger py-4"><i class="fas fa-exclamation-triangle me-2"></i>Error loading data</td></tr>';
    }
  },

  formatNominalInput: function () {
    const nominalInput = document.getElementById("nominal");
    if (!nominalInput) return;

    // Format saat user mengetik
    nominalInput.addEventListener("input", function (e) {
      let value = e.target.value;

      // Hapus semua karakter non-digit kecuali koma
      let rawValue = value.replace(/[^\d,]/g, "");

      // Simpan nilai raw untuk nanti
      e.target.setAttribute("data-raw-value", rawValue.replace(/,/g, ""));

      // Format dengan titik sebagai pemisah ribuan
      if (rawValue) {
        // Ubah koma menjadi titik untuk formatting
        let numericValue = rawValue.replace(/[^\d]/g, "");

        // Format ke IDR
        let formattedValue = new Intl.NumberFormat("id-ID").format(
          parseInt(numericValue) || 0
        );

        // Update tampilan
        e.target.value = formattedValue;
      } else {
        e.target.value = "";
      }
    });

    // Format saat input kehilangan fokus
    nominalInput.addEventListener("blur", function (e) {
      let rawValue = e.target.getAttribute("data-raw-value") || "";

      if (rawValue) {
        let numericValue = parseInt(rawValue) || 0;
        let formattedValue = new Intl.NumberFormat("id-ID").format(
          numericValue
        );
        e.target.value = formattedValue;
      }
    });

    // Saat input mendapatkan fokus, tampilkan nilai asli
    nominalInput.addEventListener("focus", function (e) {
      let rawValue = e.target.getAttribute("data-raw-value") || "";
      e.target.value = rawValue;
    });

    // Validasi saat form disubmit
    nominalInput.addEventListener("change", function (e) {
      let rawValue = e.target.getAttribute("data-raw-value") || "";
      if (!rawValue || parseInt(rawValue) <= 0) {
        e.target.classList.add("is-invalid");
      } else {
        e.target.classList.remove("is-invalid");
      }
    });
  },

  getRawNominalValue: function () {
    const nominalInput = document.getElementById("nominal");
    if (!nominalInput) return 0;

    const rawValue = nominalInput.getAttribute("data-raw-value") || "";
    return parseInt(rawValue.replace(/[^\d]/g, "")) || 0;
  },

  // Submit transaction form
  submitTransaksi: async function () {
    if (!auth.isLoggedIn()) {
      alert("Harap login terlebih dahulu");
      return;
    }

    const namaDonatur = document.getElementById("namaDonatur").value.trim();
    const kategori = document.getElementById("kategori").value;
    const nominal = this.getRawNominalValue(); // Mengambil nilai asli
    // const nominal = document.getElementById("nominal").value;
    const penerima = document.getElementById("penerima").value.trim();
    const setor = document.getElementById("setor").value;
    const keterangan = document.getElementById("keterangan").value;
    const buktiFile = document.getElementById("buktiFile").files[0];

    // Validation
    if (
      !namaDonatur ||
      !kategori ||
      !nominal ||
      !penerima ||
      !setor ||
      !keterangan
    ) {
      utils.showError("Harap isi semua field yang wajib diisi!");
      return;
    }

    if (parseFloat(nominal) <= 0) {
      utils.showError("Nominal harus lebih dari 0");
      return;
    }

    const submitBtn = document.querySelector(
      '#transaksi-form button[type="button"]'
    );
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin me-2"></i>Menyimpan...';

    const uploadStatus = document.getElementById("upload-status");
    let driveUrl = "";

    // Upload file to Google Drive if exists
    if (buktiFile) {
      // Check authentication
      if (
        !window.driveService ||
        !window.driveService.isAuthenticated ||
        !window.driveService.isAuthenticated()
      ) {
        utils.showError(
          "Harap hubungkan Google Drive terlebih dahulu untuk upload bukti"
        );
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        return;
      }

      if (uploadStatus) {
        uploadStatus.style.display = "block";
        uploadStatus.className = "alert alert-info";
        uploadStatus.innerHTML =
          '<i class="fas fa-spinner fa-spin me-2"></i>Mengunggah ke Google Drive...';
      }

      try {
        // Show upload progress
        const uploadProgress = document.getElementById("upload-progress");
        if (uploadProgress) {
          uploadProgress.style.display = "inline-block";
          const progressSpan = uploadProgress.querySelector("span");
          if (progressSpan) {
            progressSpan.textContent = "0%";
          }
        }

        // Upload to Drive - PERBAIKAN: Tambahkan error handling yang lebih baik
        try {
          driveUrl = await window.driveService.uploadFile(buktiFile);

          if (uploadStatus) {
            uploadStatus.className = "alert alert-success";
            uploadStatus.innerHTML = `<i class="fas fa-check me-2"></i>Bukti berhasil diunggah ke Google Drive!`;
          }

          // Update progress indicator
          if (uploadProgress) {
            uploadProgress.className = "badge bg-success me-2";
            const progressSpan = uploadProgress.querySelector("span");
            if (progressSpan) {
              progressSpan.innerHTML =
                '<i class="fas fa-check me-1"></i>Uploaded!';
            }

            setTimeout(() => {
              uploadProgress.style.display = "none";
              uploadProgress.className = "badge bg-info me-2";
            }, 2000);
          }

          if (uploadStatus) {
            setTimeout(() => {
              uploadStatus.style.display = "none";
            }, 3000);
          }
        } catch (uploadError) {
          console.error("Error uploading to Drive:", uploadError);

          // PERBAIKAN: Cek apakah upload sebenarnya berhasil meskipun ada error parsing response
          if (
            (uploadError.message &&
              uploadError.message.includes("Already exists")) ||
            (uploadError.message &&
              uploadError.message.includes("already exists"))
          ) {
            // File mungkin sudah terupload tapi ada issue dengan response
            console.warn("File mungkin sudah terupload:", uploadError);
            if (uploadStatus) {
              uploadStatus.className = "alert alert-warning";
              uploadStatus.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>File mungkin sudah ada di Drive. Melanjutkan...`;

              // Coba dapatkan URL dari error message atau cari alternatif
              if (uploadError.fileUrl) {
                driveUrl = uploadError.fileUrl;
              }
            }
          } else {
            throw uploadError; // Re-throw error yang lain
          }
        }
      } catch (error) {
        console.error("Error in file upload process:", error);

        if (uploadStatus) {
          uploadStatus.className = "alert alert-danger";
          uploadStatus.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>Gagal mengunggah: ${
            error.message || "Unknown error"
          }`;
        }

        const shouldContinue = confirm(
          "Gagal mengunggah bukti setoran ke Google Drive. Lanjutkan tanpa bukti?"
        );

        if (!shouldContinue) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
          if (uploadStatus) {
            uploadStatus.style.display = "none";
          }
          return;
        }
      }
    }

    // Prepare data for spreadsheet
    const transactionDate =
      this.dateConfig.manualInput && this.dateConfig.currentDate
        ? this.dateConfig.currentDate.toISOString()
        : new Date().toISOString();

    const values = [
      transactionDate, // MENGGUNAKAN TANGGAL DARI CONFIG ATAU OTOMATIS
      namaDonatur,
      kategori,
      parseFloat(nominal),
      penerima,
      setor,
      keterangan,
      driveUrl || "",
    ];

    try {
      // PERBAIKAN: Tambahkan logging untuk debug
      console.log("Submitting data to spreadsheet:", values);

      const success = await api.appendData(`${CONFIG.SHEETS.DANA}!A:H`, values);

      if (success) {
        utils.showSuccess("Data transaksi berhasil ditambahkan!");
        this.resetForm();
        await this.loadTransaksiList();

        // Update dashboard jika function ada
        if (typeof updateDashboardStats === "function") {
          try {
            await updateDashboardStats();
            console.log("Dashboard updated successfully");
          } catch (dashboardError) {
            console.error("Error updating dashboard:", dashboardError);
            // Jangan ganggu flow utama jika dashboard error
          }
        } else {
          console.warn("updateDashboardStats function not found");
        }
      }
    } catch (error) {
      console.error("Error submitting transaction:", error);

      // PERBAIKAN: Tampilkan pesan error yang lebih spesifik
      let errorMessage = "Error: " + error.message;
      if (error.message.includes("Quota")) {
        errorMessage = "Kuota Google Sheets terlampaui. Coba lagi nanti.";
      } else if (error.message.includes("Network")) {
        errorMessage =
          "Koneksi jaringan bermasalah. Periksa koneksi internet Anda.";
      } else if (error.message.includes("Permission")) {
        errorMessage = "Anda tidak memiliki izin untuk menulis data.";
      }

      utils.showError(errorMessage);
    } finally {
      // PERBAIKAN: Pastikan button selalu di-reset
      if (submitBtn && submitBtn.disabled) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  },

  // Handle file selection
  handleFileSelect: function (event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      utils.showError("Ukuran file terlalu besar. Maksimal 10MB");
      event.target.value = "";
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      utils.showError(
        "Tipe file tidak didukung. Hanya JPG, PNG, GIF, BMP, WebP, PDF, DOC, DOCX, XLS, XLSX"
      );
      event.target.value = "";
      return;
    }

    const previewContainer = document.getElementById("preview-container");
    const fileName = document.getElementById("file-name");
    const fileSize = document.getElementById("file-size");
    const previewImage = document.getElementById("preview-image");

    if (!previewContainer || !fileName || !fileSize || !previewImage) {
      console.warn("Preview elements not found");
      return;
    }

    const imgElement = previewImage.querySelector("img");

    fileName.textContent = file.name;
    fileSize.textContent = this.formatFileSize(file.size);
    previewContainer.style.display = "block";

    // Show image preview if it's an image
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function (e) {
        if (imgElement) {
          imgElement.src = e.target.result;
        }
        previewImage.style.display = "block";
      };
      reader.readAsDataURL(file);
    } else {
      previewImage.style.display = "none";
    }
  },

  // Format file size
  formatFileSize: function (bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  // Remove file
  removeFile: function () {
    const fileInput = document.getElementById("buktiFile");
    if (fileInput) {
      fileInput.value = "";
    }

    const previewContainer = document.getElementById("preview-container");
    if (previewContainer) {
      previewContainer.style.display = "none";
    }

    const uploadStatus = document.getElementById("upload-status");
    if (uploadStatus) {
      uploadStatus.style.display = "none";
    }

    // Reset upload progress
    const uploadProgress = document.getElementById("upload-progress");
    if (uploadProgress) {
      uploadProgress.style.display = "none";
      const progressSpan = uploadProgress.querySelector("span");
      if (progressSpan) {
        progressSpan.textContent = "0%";
      }
      uploadProgress.className = "badge bg-info me-2";
    }
  },

  // Reset form
  resetForm: function () {
    const form = document.getElementById("transaksi-form");
    if (form) {
      form.reset();
    }
    this.removeFile();

    // Reset tanggal manual
    this.cancelManualDate();
    this.dateConfig.manualInput = false;
    this.dateConfig.currentDate = null;
  },

  // Copy link
  copyLink: function (url) {
    if (!url) {
      utils.showError("Tidak ada link untuk disalin");
      return;
    }

    navigator.clipboard
      .writeText(url)
      .then(() => {
        utils.showSuccess("Link berhasil disalin!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);

        // Fallback method
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          utils.showSuccess("Link berhasil disalin!");
        } catch (e) {
          console.error("Fallback copy failed:", e);
          utils.showError("Gagal menyalin link");
        }
        document.body.removeChild(textArea);
      });
  },

  // Initialize Drive UI
  initDriveUI: async function () {
    const statusDiv = document.getElementById("drive-status");
    const statusText = document.getElementById("drive-status-text");
    const actionsDiv = document.getElementById("drive-actions");
    const fileInput = document.getElementById("buktiFile");

    if (!statusDiv || !statusText || !actionsDiv) {
      console.warn("Drive UI elements not found");
      return;
    }

    try {
      // Ensure drive service is initialized
      if (!window.driveService) {
        try {
          window.driveService = await window.initDriveService();
        } catch (initError) {
          console.warn("Could not initialize drive service:", initError);
          // Continue without drive service
        }
      }

      if (!window.driveService) {
        statusDiv.className = "alert alert-warning";
        statusText.textContent = "Google Drive service not available";
        if (fileInput) fileInput.disabled = true;
        return;
      }

      const authStatus = window.driveService.getAuthStatus
        ? window.driveService.getAuthStatus()
        : { authenticated: false, message: "Service error" };

      // Update UI
      if (authStatus.authenticated) {
        statusDiv.className = "alert alert-success";
        statusText.innerHTML = `<i class="fas fa-check-circle me-2"></i>${
          authStatus.message || "Connected to Google Drive"
        }`;
        actionsDiv.innerHTML = `
          <button class="btn btn-sm btn-outline-danger" onclick="transaksi.disconnectDrive()">
            <i class="fas fa-unlink me-1"></i>Disconnect
          </button>
        `;

        if (fileInput) {
          fileInput.disabled = false;
          fileInput.title = "Click to select file for upload";
        }
      } else {
        statusDiv.className = "alert alert-warning";
        statusText.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i>${
          authStatus.message || "Not connected to Google Drive"
        }`;
        actionsDiv.innerHTML = `
          <button class="btn btn-sm btn-outline-success" onclick="transaksi.connectDrive()">
            <i class="fab fa-google-drive me-1"></i>Connect Google Drive
          </button>
        `;

        if (fileInput) {
          fileInput.disabled = true;
          fileInput.title = "Please connect Google Drive first";
        }
      }
    } catch (error) {
      console.error("Error in initDriveUI:", error);
      statusDiv.className = "alert alert-danger";
      statusText.textContent = "Error: " + (error.message || "Unknown error");

      if (fileInput) {
        fileInput.disabled = true;
      }
    }
  },

  // Connect to Google Drive
  connectDrive: async function () {
    try {
      if (!window.driveService) {
        window.driveService = await window.initDriveService();
      }

      if (!window.driveService) {
        utils.showError("Failed to initialize Google Drive service");
        return;
      }

      // Show loading state
      const statusDiv = document.getElementById("drive-status");
      const statusText = document.getElementById("drive-status-text");
      const actionsDiv = document.getElementById("drive-actions");

      if (statusDiv && statusText && actionsDiv) {
        statusDiv.className = "alert alert-info";
        statusText.innerHTML =
          '<i class="fas fa-spinner fa-spin me-2"></i>Opening Google authentication...';
        actionsDiv.innerHTML = "";
      }

      // AUTHENTICATION SUCCESS - Update UI
      if (statusDiv && statusText && actionsDiv) {
        statusDiv.className = "alert alert-success";
        statusText.innerHTML =
          '<i class="fas fa-check-circle me-2"></i>Successfully connected to Google Drive!';
      }

      // Start authentication
      await window.driveService.authenticate();
    } catch (error) {
      console.error("Error connecting to Drive:", error);

      // Reset UI on error
      await this.initDriveUI();

      if (error.message && error.message.includes("Popup blocked")) {
        utils.showError("Popup blocked! Please allow popups for this site.");

        // Alternative: redirect to auth page
        if (
          confirm(
            "Popup was blocked. Would you like to authenticate in a new tab instead?"
          )
        ) {
          const authUrl = window.driveService.generateOAuthURL
            ? window.driveService.generateOAuthURL()
            : "#";
          window.open(authUrl, "_blank");
        }
      } else {
        utils.showError(
          "Failed to connect: " + (error.message || "Unknown error")
        );
      }
    }
  },

  // Disconnect from Google Drive
  disconnectDrive: async function () {
    if (confirm("Are you sure you want to disconnect from Google Drive?")) {
      try {
        if (window.driveService && window.driveService.signOut) {
          await window.driveService.signOut();
        }
      } catch (error) {
        console.error("Error during sign out:", error);
      } finally {
        await this.initDriveUI();
        utils.showNotification("Google Drive", "Google Drive disconnected", "info");
      }
    }
  },
};

// Initialize transaksi
window.transaksi = transaksi.init();

// Export for global access
if (typeof module !== "undefined" && module.exports) {
  module.exports = transaksi;
}
