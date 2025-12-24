// Report module
const laporan = {
  currentFilters: {
    startDate: "",
    endDate: "",
    donatur: "",
    kategori: "",
    penerima: "",
    setor: "",
    keterangan: "",
  },

  currentData: [], // Tambahkan ini untuk menyimpan data yang difilter
  sortOrder: "asc", // 'asc' untuk terlama ke terbaru, 'desc' untuk terbaru ke terlama

  // Show report page
  showLaporan: async function () {
    setActiveNav("laporan.showLaporan");

    try {
      // Load all necessary data for filters
      const [allData, kategori, setor, keterangan, donaturList, penerimaList] =
        await Promise.all([
          api.fetchData(`${CONFIG.SHEETS.DANA}!A2:G`),
          api.fetchData(`${CONFIG.SHEETS.MASTER_KATEGORI}!A2:A`),
          api.fetchData(`${CONFIG.SHEETS.MASTER_SETOR}!A2:A`),
          api.fetchData(`${CONFIG.SHEETS.MASTER_KETERANGAN}!A2:A`),
          api.fetchData(`${CONFIG.SHEETS.DANA}!B2:B`),
          api.fetchData(`${CONFIG.SHEETS.DANA}!E2:E`),
        ]);

      // Get unique values
      const uniqueDonatur = [...new Set(donaturList.flat())]
        .filter(Boolean)
        .sort();
      const uniquePenerima = [...new Set(penerimaList.flat())]
        .filter(Boolean)
        .sort();

      const content = `
                <h2 class="mb-4"><i class="fas fa-chart-bar me-2"></i>Laporan Dana</h2>
                
                <!-- Filter Section -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="fas fa-filter me-2"></i>Filter Laporan</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <label for="startDate" class="form-label">Tanggal Mulai</label>
                                <input type="date" class="form-control" id="startDate" 
                                       value="${this.currentFilters.startDate}">
                            </div>
                            <div class="col-md-3 mb-3">
                                <label for="endDate" class="form-label">Tanggal Akhir</label>
                                <input type="date" class="form-control" id="endDate" 
                                       value="${this.currentFilters.endDate}">
                            </div>
                            <div class="col-md-3 mb-3">
                                <label for="filterDonatur" class="form-label">Donatur</label>
                                <select class="form-select" id="filterDonatur">
                                    <option value="">Semua Donatur</option>
                                    ${uniqueDonatur
                                      .map(
                                        (item) =>
                                          `<option value="${item}">${item}</option>`
                                      )
                                      .join("")}
                                </select>
                            </div>
                            <div class="col-md-3 mb-3">
                                <label for="filterPenerima" class="form-label">Penerima</label>
                                <select class="form-select" id="filterPenerima">
                                    <option value="">Semua Penerima</option>
                                    ${uniquePenerima
                                      .map(
                                        (item) =>
                                          `<option value="${item}">${item}</option>`
                                      )
                                      .join("")}
                                </select>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <label for="filterKategori" class="form-label">Kategori</label>
                                <select class="form-select" id="filterKategori">
                                    <option value="">Semua Kategori</option>
                                    ${kategori
                                      .filter(Boolean)
                                      .map(
                                        (item) =>
                                          `<option value="${item[0]}">${item[0]}</option>`
                                      )
                                      .join("")}
                                </select>
                            </div>
                            <div class="col-md-3 mb-3">
                                <label for="filterSetor" class="form-label">Bentuk Setoran</label>
                                <select class="form-select" id="filterSetor">
                                    <option value="">Semua Setoran</option>
                                    ${setor
                                      .filter(Boolean)
                                      .map(
                                        (item) =>
                                          `<option value="${item[0]}">${item[0]}</option>`
                                      )
                                      .join("")}
                                </select>
                            </div>
                            <div class="col-md-3 mb-3">
                                <label for="filterKeterangan" class="form-label">Keterangan</label>
                                <select class="form-select" id="filterKeterangan">
                                    <option value="">Semua Keterangan</option>
                                    ${keterangan
                                      .filter(Boolean)
                                      .map(
                                        (item) =>
                                          `<option value="${item[0]}">${item[0]}</option>`
                                      )
                                      .join("")}
                                </select>
                            </div>
                            <div class="col-md-3 mb-3">
                                <label for="minNominal" class="form-label">Minimal Nominal (Rp)</label>
                                <input type="number" class="form-control" id="minNominal" min="0" placeholder="0">
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-between">
                            <div>
                                <button onclick="laporan.applyFilters()" class="btn btn-primary">
                                    <i class="fas fa-filter me-2"></i>Terapkan Filter
                                </button>
                                <button onclick="laporan.resetFilters()" class="btn btn-secondary ms-2">
                                    <i class="fas fa-redo me-2"></i>Reset Filter
                                </button>
                            </div>
                            <div>
                                <button onclick="laporan.exportToExcel()" class="btn btn-success">
                                    <i class="fas fa-file-excel me-2"></i>Export Excel
                                </button>
                                <button onclick="laporan.printReport()" class="btn btn-info ms-2">
                                    <i class="fas fa-print me-2"></i>Print
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Summary Cards -->
                <div class="row mb-4" id="report-summary" style="display: none;">
                    <!-- Summary will be loaded here -->
                </div>
                
                <!-- styling card block -->
                <style>
        .stat-card {
            transition: transform 0.2s;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        .stat-card .card-body {
            padding: 1.5rem;
        }
        .stat-card h3 {
            font-size: 1.8rem;
            margin-bottom: 0.5rem;
        }
        .stat-card small {
            font-size: 0.8rem;
        }
    </style>
    
    <h2 class="mb-4"><i class="fas fa-chart-bar me-2"></i>Laporan Dana</h2>
    
    <!-- Filter Section -->
    <!-- ... kode filter ... -->
    
    <!-- Summary Cards -->
    <div class="mb-4" id="report-summary" style="display: none;">
        <!-- Summary will be loaded here -->
    </div>
    
    <!-- Report Table -->
    <!-- ... kode tabel ... -->


                <!-- Report Table -->
                <div class="card">
                    <div class="card-header">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Data Laporan</h5>
                            <span id="report-count" class="badge bg-primary">0 data</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped" id="report-table">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Tanggal</th>
                                        <th>Donatur</th>
                                        <th>Kategori</th>
                                        <th>Nominal</th>
                                        <th>Penerima</th>
                                        <th>Setoran</th>
                                        <th>Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody id="report-data">
                                    <tr>
                                        <td colspan="8" class="text-center text-muted">
                                            Gunakan filter untuk menampilkan data
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot id="report-total" style="display: none;">
                                    <!-- Total will be added here -->
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            `;

      document.getElementById("content-area").innerHTML = content;

      // Set current filter values if exists
      if (this.currentFilters.donatur) {
        document.getElementById("filterDonatur").value =
          this.currentFilters.donatur;
      }
      if (this.currentFilters.kategori) {
        document.getElementById("filterKategori").value =
          this.currentFilters.kategori;
      }
      if (this.currentFilters.penerima) {
        document.getElementById("filterPenerima").value =
          this.currentFilters.penerima;
      }
      if (this.currentFilters.setor) {
        document.getElementById("filterSetor").value =
          this.currentFilters.setor;
      }
      if (this.currentFilters.keterangan) {
        document.getElementById("filterKeterangan").value =
          this.currentFilters.keterangan;
      }
    } catch (error) {
      console.error("Error loading report:", error);
      utils.showError(`Error loading report: ${error.message}`);
    }
  },

  // Apply filters
  applyFilters: async function () {
    try {
      // Get filter values
      this.currentFilters = {
        startDate: document.getElementById("startDate").value,
        endDate: document.getElementById("endDate").value,
        donatur: document.getElementById("filterDonatur").value,
        kategori: document.getElementById("filterKategori").value,
        penerima: document.getElementById("filterPenerima").value,
        setor: document.getElementById("filterSetor").value,
        keterangan: document.getElementById("filterKeterangan").value,
      };

      const minNominal =
        parseFloat(document.getElementById("minNominal").value) || 0;

      // Load all data
      const allData = await api.fetchData(`${CONFIG.SHEETS.DANA}!A2:G`);

      if (allData.length === 0) {
        document.getElementById("report-data").innerHTML = `
                    <tr><td colspan="8" class="text-center">Tidak ada data transaksi</td></tr>
                `;
        document.getElementById("report-count").textContent = "0 data";
        return;
      }

      // Apply filters
      const filteredData = allData.filter((row) => {
        const rowDate = new Date(row[0]).toISOString().split("T")[0];
        const nominal = parseFloat(row[3]) || 0;

        // Date filter
        if (
          this.currentFilters.startDate &&
          rowDate < this.currentFilters.startDate
        )
          return false;
        if (
          this.currentFilters.endDate &&
          rowDate > this.currentFilters.endDate
        )
          return false;

        // Donatur filter
        if (
          this.currentFilters.donatur &&
          row[1] !== this.currentFilters.donatur
        )
          return false;

        // Kategori filter
        if (
          this.currentFilters.kategori &&
          row[2] !== this.currentFilters.kategori
        )
          return false;

        // Penerima filter
        if (
          this.currentFilters.penerima &&
          row[4] !== this.currentFilters.penerima
        )
          return false;

        // Setor filter
        if (this.currentFilters.setor && row[5] !== this.currentFilters.setor)
          return false;

        // Keterangan filter
        if (
          this.currentFilters.keterangan &&
          row[6] !== this.currentFilters.keterangan
        )
          return false;

        // Nominal filter
        if (minNominal > 0 && nominal < minNominal) return false;

        return true;
      });

      // Simpan data yang difilter
      this.currentData = filteredData;
      this.sortOrder = "asc"; // Reset ke default

      // Display results
      this.displayReport(filteredData);
    } catch (error) {
      console.error("Error applying filters:", error);
      alert("Error menerapkan filter: " + error.message);
    }
  },

  // Tambahkan fungsi sorting
  sortReport: function (order) {
    if (this.currentData.length === 0) return;

    this.sortOrder = order;
    let sortedData = [...this.currentData];

    sortedData.sort((a, b) => {
      try {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return order === "asc" ? dateA - dateB : dateB - dateA;
      } catch (e) {
        return 0;
      }
    });

    this.displayReport(sortedData);

    // Update button states
    const buttons = document.querySelectorAll(".btn-group .btn");
    buttons.forEach((btn) => {
      if (btn.textContent.includes(order === "asc" ? "Terlama" : "Terbaru")) {
        btn.classList.remove("btn-outline-primary", "btn-outline-secondary");
        btn.classList.add("btn-primary");
      } else {
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-outline-primary", "btn-outline-secondary");
      }
    });
  },

  // Display report data
  displayReport: function (data) {
    if (data.length === 0) {
      document.getElementById("report-data").innerHTML = `
                <tr><td colspan="8" class="text-center">Tidak ada data yang sesuai dengan filter</td></tr>
            `;
      document.getElementById("report-count").textContent = "0 data";
      document.getElementById("report-summary").style.display = "none";
      document.getElementById("report-total").style.display = "none";
      return;
    }

    // Calculate totals
    const totalNominal = data.reduce(
      (sum, row) => sum + (parseFloat(row[3]) || 0),
      0
    );
    const avgNominal = data.length > 0 ? totalNominal / data.length : 0;

    // Update count
    document.getElementById("report-count").textContent = `${data.length} data`;

    // Show summary
    document.getElementById("report-summary").style.display = "block";
    document.getElementById("report-summary").innerHTML = `
    <div class="d-flex flex-wrap gap-3 justify-content-center">
        <div class="card bg-primary text-white" style="min-width: 200px; flex: 1;">
            <div class="card-body text-center">
                <h6 class="card-subtitle mb-2">Total Data</h6>
                <h3 class="card-title">${data.length}</h3>
                <small class="opacity-75">Transaksi</small>
            </div>
        </div>
        
        <div class="card bg-success text-white" style="min-width: 200px; flex: 1;">
            <div class="card-body text-center">
                <h6 class="card-subtitle mb-2">Total Nominal</h6>
                <h3 class="card-title">${utils.formatCurrency(
                  totalNominal
                )}</h3>
                <small class="opacity-75">Keseluruhan</small>
            </div>
        </div>
        
        <div class="card bg-info text-white" style="min-width: 200px; flex: 1;">
            <div class="card-body text-center">
                <h6 class="card-subtitle mb-2">Rata-rata</h6>
                <h3 class="card-title">${utils.formatCurrency(avgNominal)}</h3>
                <small class="opacity-75">Per transaksi</small>
            </div>
        </div>
        
        <div class="card bg-warning text-dark" style="min-width: 200px; flex: 1;">
            <div class="card-body text-center">
                <h6 class="card-subtitle mb-2">Donatur Unik</h6>
                <h3 class="card-title">${
                  [...new Set(data.map((row) => row[1]))].filter(Boolean).length
                }</h3>
                <small class="opacity-75">Orang</small>
            </div>
        </div>
    </div>
`;

    // 1. Urutkan data dari terlama ke terbaru (ascending)
    const sortedData = [...data].sort((a, b) => {
      try {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateA - dateB; // Ascending: terlama ke terbaru
      } catch (e) {
        return 0;
      }
    });

    // Display data
    const html = sortedData
      .map(
        (row, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${utils.formatDate(row[0])}</td>
                <td>${row[1] || "-"}</td>
                <td>${row[2] || "-"}</td>
                <td class="text-end">${utils.formatCurrency(row[3])}</td>
                <td>${row[4] || "-"}</td>
                <td>${row[5] || "-"}</td>
                <td>${row[6] || "-"}</td>
            </tr>
        `
      )
      .join("");

    document.getElementById("report-data").innerHTML = html;

    // Show total row
    document.getElementById("report-total").style.display =
      "table-footer-group";
    document.getElementById("report-total").innerHTML = `
            <tr class="table-info fw-bold">
                <td colspan="4" class="text-end">TOTAL:</td>
                <td class="text-end">${utils.formatCurrency(totalNominal)}</td>
                <td colspan="3"></td>
            </tr>
        `;
  },

  // Reset filters
  resetFilters: function () {
    this.currentFilters = {
      startDate: "",
      endDate: "",
      donatur: "",
      kategori: "",
      penerima: "",
      setor: "",
      keterangan: "",
    };

    // Clear all filter inputs
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    document.getElementById("filterDonatur").value = "";
    document.getElementById("filterKategori").value = "";
    document.getElementById("filterPenerima").value = "";
    document.getElementById("filterSetor").value = "";
    document.getElementById("filterKeterangan").value = "";
    document.getElementById("minNominal").value = "";

    // Clear report display
    document.getElementById("report-data").innerHTML = `
            <tr><td colspan="8" class="text-center text-muted">Gunakan filter untuk menampilkan data</td></tr>
        `;
    document.getElementById("report-count").textContent = "0 data";
    document.getElementById("report-summary").style.display = "none";
    document.getElementById("report-total").style.display = "none";
  },

  // Export to Excel
  exportToExcel: async function () {
    try {
      // Get current filtered data or all data
      const allData = await api.fetchData(`${CONFIG.SHEETS.DANA}!A2:G`);

      // Apply current filters if any
      let exportData = allData;
      if (Object.values(this.currentFilters).some((val) => val !== "")) {
        exportData = allData.filter((row) => {
          const rowDate = new Date(row[0]).toISOString().split("T")[0];

          // Apply all current filters
          if (
            this.currentFilters.startDate &&
            rowDate < this.currentFilters.startDate
          )
            return false;
          if (
            this.currentFilters.endDate &&
            rowDate > this.currentFilters.endDate
          )
            return false;
          if (
            this.currentFilters.donatur &&
            row[1] !== this.currentFilters.donatur
          )
            return false;
          if (
            this.currentFilters.kategori &&
            row[2] !== this.currentFilters.kategori
          )
            return false;
          if (
            this.currentFilters.penerima &&
            row[4] !== this.currentFilters.penerima
          )
            return false;
          if (this.currentFilters.setor && row[5] !== this.currentFilters.setor)
            return false;
          if (
            this.currentFilters.keterangan &&
            row[6] !== this.currentFilters.keterangan
          )
            return false;

          return true;
        });
      }

      if (exportData.length === 0) {
        alert("Tidak ada data untuk di-export");
        return;
      }

      // Urutkan data dari terlama ke terbaru untuk export juga
      const sortedExportData = [...exportData].sort((a, b) => {
        try {
          const dateA = new Date(a[0]);
          const dateB = new Date(b[0]);
          return dateA - dateB; // Ascending: terlama ke terbaru
        } catch (e) {
          return 0;
        }
      });

      // Prepare headers
      const headers = [
        "Timestamp",
        "Nama Donatur",
        "Kategori",
        "Nominal",
        "Penerima",
        "Setor",
        "Keterangan",
      ];

      // Format data for export
      const formattedData = sortedExportData.map((row, index) => [
        index + 1,
        utils.formatDate(row[0]),
        row[1] || "",
        row[2] || "",
        parseFloat(row[3]) || 0,
        row[4] || "",
        row[5] || "",
        row[6] || "",
      ]);

      // Add total row
      const total = exportData.reduce(
        (sum, row) => sum + (parseFloat(row[3]) || 0),
        0
      );
      formattedData.push(["", "", "TOTAL:", total, "", "", ""]);

      // Generate filename with date
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `laporan_dana_${dateStr}.csv`;

      // Export
      utils.exportToExcel(formattedData, headers, filename);
      utils.showSuccess("Data berhasil di-export");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error export data: " + error.message);
    }
  },

  // Print report
  printReport: function () {
    if (!this.currentData || this.currentData.length === 0) {
      alert("Tidak ada data untuk diprint. Terapkan filter terlebih dahulu.");
      return;
    }

    const printWindow = window.open("", "_blank");
    const sortedData = [...this.currentData];
    sortedData.sort((a, b) => {
      try {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);

        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0;
        }

        // Gunakan sortOrder yang sama (ascending untuk terlama ke terbaru)
        return this.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } catch (e) {
        return 0;
      }
    });
    console.log("First date:", sortedData[0] ? sortedData[0][0] : "No data");
    console.log(
      "Last date:",
      sortedData[sortedData.length - 1]
        ? sortedData[sortedData.length - 1][0]
        : "No data"
    );
    const totalNominal = sortedData.reduce(
      (sum, row) => sum + (parseFloat(row[3]) || 0),
      0
    );

    // Hitung jumlah baris per halaman
    const pageConfig = {
      firstPage: {
        rowsPerPage: 35, 
        extraSpace: 80, 
      },
      otherPages: {
        rowsPerPage: 80,
        extraSpace: 20, 
      },
    };

    // HITUNG PEMBAGIAN HALAMAN
    let pages = [];
    let currentIndex = 0;
    let pageNumber = 1;

    while (currentIndex < sortedData.length) {
      const isFirstPage = pageNumber === 1;
      const config = isFirstPage ? pageConfig.firstPage : pageConfig.otherPages;
      const rowsPerPage = config.rowsPerPage;

      // Ambil data untuk halaman ini
      const pageData = sortedData.slice(
        currentIndex,
        currentIndex + rowsPerPage
      );

      pages.push({
        data: pageData,
        pageNumber: pageNumber,
        startIndex: currentIndex,
        config: config,
        isFirstPage: isFirstPage,
        isLastPage: currentIndex + rowsPerPage >= sortedData.length,
      });

      currentIndex += pageData.length;
      pageNumber++;
    }

    const totalPages = pages.length;

    // 4. GENERATE SETIAP HALAMAN DENGAN KONFIGURASINYA
    let pagesHTML = "";

    pages.forEach((pageInfo) => {
      pagesHTML += this.generatePrintPage(
        pageInfo.data,
        pageInfo.pageNumber,
        pageInfo.isLastPage,
        totalNominal,
        pageInfo.startIndex,
        totalPages,
        pageInfo.config,
        pageInfo.isFirstPage
      );
    });

    printWindow.document.write(`
        <!DOCTYPE html>
    <html>
    <head>
        <title>Laporan Dana Haul Masyayikh & Harlah ke-77</title>
        <title>Pondok Pesantren Nurul Jadid Probolinggo</title>
        <style>
            @media print {
                @page {
                    margin: 10mm 15mm;
                    size: F4 portrait;
                }
                
                @page :first {
                    margin-top: 5mm; /* Margin khusus untuk halaman pertama */
                }
                
                body {
                    font-family: 'Arial', sans-serif;
                    font-size: 10pt;
                    margin: 0;
                    padding: 0;
                    line-height: 1;
                }
                
                .page {
                    page-break-after: always;
                    width: 100%;
                    min-height: 310mm; /* Tinggi F4 (330mm - margin 20mm) */
                    position: relative;
                }
                
                .page:last-child {
                    page-break-after: auto;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 9pt;
                }
                
                th, td {
                    border: 1px solid #ccc;
                    padding: 3px 2px;
                    text-align: left;
                    font-size: 8pt;
                    line-height: 1.1;
                }
                
                /* Sembunyikan tfoot di semua halaman kecuali yang terakhir */
                tfoot {
                    display: none;
                }
                
                /* Hanya tampilkan tfoot di halaman terakhir */
                .last-page tfoot {
                    display: table-footer-group;
                }
                
                /* Header tabel hanya di halaman pertama */
                thead {
                    display: table-header-group;
                }
                
                /* Pastikan baris tidak terpotong */
                tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                }
                
                /* Kontrol page break */
                .page-break-control {
                    page-break-inside: avoid;
                }
                
                /* Footer dengan nomor halaman */
                .page-footer {
                    position: absolute;
                    bottom: 5mm;
                    right: 0;
                    left: 0;
                    text-align: center;
                    font-size: 9pt;
                    color: #666;
                }
            }
            
            /* Untuk preview di browser */
            body {
                font-family: 'Arial', sans-serif;
                font-size: 10pt;
                margin: 0;
                padding: 10mm 15mm;
                width: 215mm; /* Lebar F4 */
                min-height: 330mm; /* Tinggi F4 */
            }
            
            .page {
                margin-bottom: 20mm;
                border-bottom: 1px dashed #ccc;
                width: 100%;
                min-height: 310mm;
                position: relative;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
            }
            
            th, td {
                border: 1px solid #ccc;
                padding: 3px 2px;
                font-size: 9pt;
            }
            
            th {
                background-color: #f2f2f2;
                font-weight: bold;
            }
            .page-footer {
                position: absolute;
                bottom: 10px;
                right: 0;
                left: 0;
                text-align: center;
                font-size: 9pt;
                color: #666;
            }
        </style>
    </head>
    <body>
        ${pagesHTML}
        
        <script>
              window.onload = function() {
                // Periksa apakah ada konten di halaman pertama
                const firstPage = document.querySelector('.page');
                if (firstPage) {
                    const firstPageHeight = firstPage.offsetHeight;
                    const pageHeight = 330 * 3.78; // F4 height in pixels (330mm * 3.78px/mm)
                    
                    console.log('First page height:', firstPageHeight, 'px');
                    console.log('F4 page height:', pageHeight, 'px');
                    
                    // Jika halaman pertama terlalu tinggi, sesuaikan
                    if (firstPageHeight > pageHeight) {
                        console.log('First page too tall, adjusting...');
                        // Kurangi padding atau margin
                        const tables = firstPage.querySelectorAll('table');
                        tables.forEach(table => {
                            table.style.marginTop = '0';
                        });
                    }
                }
                
                // Hitung ulang total pages untuk verifikasi
                const pages = document.querySelectorAll('.page');
                console.log('Total pages found:', pages.length);
                
                setTimeout(function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 500);
                }, 300);
            };
        </script>
    </body>
    </html>
`);

    printWindow.document.close();
  },

  // Fungsi untuk generate halaman print
  generatePrintPage: function (
    pageData,
    pageNumber,
    isLastPage,
    totalNominal,
    startIndex,
    totalPages,
    config,
    isFirstPageParam)
   {
    const isFirstPage = typeof isFirstPageParam !== 'undefined' ? isFirstPageParam : (pageNumber === 1);
    if (!config) {
        config = {
            rowsPerPage: isFirstPage ? 35 : 40,
            extraSpace: isFirstPage ? 80 : 20
        };
    }
    const tableRows = pageData
      .map(
        (row, index) => `
        <tr>
            <td style="text-align: center; width: 5%;">${
              startIndex + index + 1
            }</td>
            <td style="width: 12%;">${utils.formatDate(row[0])}</td>
            <td style="width: 15%;">${row[1] || "-"}</td>
            <td style="width: 10%;">${row[2] || "-"}</td>
            <td style="text-align: right; width: 13%;">${utils.formatCurrency(
              row[3]
            )}</td>
            <td style="width: 15%;">${row[4] || "-"}</td>
            <td style="width: 10%;">${row[5] || "-"}</td>
            <td style="width: 20%;">${row[6] || "-"}</td>
        </tr>
    `
      )
      .join("");

    // Header hanya di halaman pertama
     const headerHTML = isFirstPage ? `
        <div style="margin-bottom: 8mm; page-break-inside: avoid;">
            <h2 style="text-align: center; margin: 0 0 3mm 0; font-size: 16pt;">Dokumentasi Dana Masuk</h2>
            <h2 style="text-align: center; margin: 0 0 3mm 0; font-size: 16pt;">Haul Masyayikh dan Harlah ke-77</h2>
            <h2 style="text-align: center; margin: 0 0 3mm 0; font-size: 15pt;">Pondok Pesantren Nurul Jadid Paiton Probolinggo</h2>
            <p style="text-align: center; margin: 0 0 3mm 0; font-size: 10pt; color: #666;">
                Dicetak: ${new Date().toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </p>
            <div style="background: #f5f5f5; padding: 4mm; border-left: 4px solid #007bff; font-size: 10pt; margin-bottom: 4mm;">
                <strong>RINGKASAN:</strong> ${this.currentData.length} transaksi | 
                <strong>TOTAL:</strong> ${utils.formatCurrency(totalNominal)}<br>
                <strong>FILTER:</strong> ${this.getAppliedFiltersText()}
            </div>
        </div>
    ` : `
        <div style="
            margin-top: 3mm;
            margin-bottom: 3mm;
            font-size: 10pt;
            page-break-inside: avoid;
        ">
            <div style="
                background: #ffffffff;
                padding: 3mm;
                border-left: 3px solid #1268b3ff;
                border-radius: 3px;
            ">
                <strong>LAPORAN DANA</strong> 
                <span>Lanjutan dari halaman ${pageNumber - 1}</span>
            </div>
        </div>
    `;

  // FONT SIZE DAN PADDING BERBEDA
    const tableFontSize = isFirstPage ? '9pt' : '8pt';
    const thPadding = isFirstPage ? '3mm 2mm' : '2mm 1mm';
    const tdPadding = isFirstPage ? '2mm 1mm' : '1.5mm 1mm';
    
    return `
        <div class="page ${isLastPage ? 'last-page' : ''} ${isFirstPage ? 'first-page' : 'other-page'}" style="
            position: relative;
            page-break-after: ${isLastPage ? 'auto' : 'always'};
            min-height: ${330 - config.extraSpace}mm;
            padding-bottom: 10mm;
        ">
            ${headerHTML}
            
            <table style="
                width: 100%; 
                border-collapse: collapse; 
                font-size: ${tableFontSize};
                margin-top: ${isFirstPage ? '0' : '1mm'};
            ">
                ${isFirstPage ? `
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="border: 1px solid #333; padding: ${thPadding}; text-align: center; font-weight: bold;">No</th>
                        <th style="border: 1px solid #333; padding: ${thPadding}; text-align: center; font-weight: bold;">Tanggal</th>
                        <th style="border: 1px solid #333; padding: ${thPadding}; text-align: center; font-weight: bold;">Donatur</th>
                        <th style="border: 1px solid #333; padding: ${thPadding}; text-align: center; font-weight: bold;">Kategori</th>
                        <th style="border: 1px solid #333; padding: ${thPadding}; text-align: center; font-weight: bold;">Nominal</th>
                        <th style="border: 1px solid #333; padding: ${thPadding}; text-align: center; font-weight: bold;">Penerima</th>
                        <th style="border: 1px solid #333; padding: ${thPadding}; text-align: center; font-weight: bold;">Setoran</th>
                        <th style="border: 1px solid #333; padding: ${thPadding}; text-align: center; font-weight: bold;">Keterangan</th>
                    </tr>
                </thead>
                ` : ''}
                
                <tbody>
                    ${tableRows}
                </tbody>
                
                ${isLastPage ? `
                <tfoot>
                    <tr style="background-color: #e9ecef; font-weight: bold; page-break-inside: avoid;">
                        <td colspan="4" style="border: 1px solid #333; padding: ${thPadding}; text-align: right;"><strong>TOTAL KESELURUHAN:</strong></td>
                        <td style="border: 1px solid #333; padding: ${thPadding}; text-align: right;"><strong>${utils.formatCurrency(totalNominal)}</strong></td>
                        <td colspan="3" style="border: 1px solid #333; padding: ${thPadding};"></td>
                    </tr>
                </tfoot>
                ` : ''}
            </table>
            
            <div style="
                position: absolute;
                bottom: 3mm;
                right: 15mm;
                font-size: 9pt;
                color: #666;
            ">
                Halaman ${pageNumber} dari ${totalPages}
                
            </div>
        </div>
    `;
},

  // Tambahkan function untuk mendapatkan teks filter yang diterapkan
  getAppliedFiltersText: function () {
    const filters = [];

    if (this.currentFilters.startDate) {
      filters.push(`Dari: ${this.currentFilters.startDate}`);
    }
    if (this.currentFilters.endDate) {
      filters.push(`Sampai: ${this.currentFilters.endDate}`);
    }
    if (this.currentFilters.donatur) {
      filters.push(`Donatur: ${this.currentFilters.donatur}`);
    }
    if (this.currentFilters.kategori) {
      filters.push(`Kategori: ${this.currentFilters.kategori}`);
    }
    if (this.currentFilters.penerima) {
      filters.push(`Penerima: ${this.currentFilters.penerima}`);
    }
    if (this.currentFilters.setor) {
      filters.push(`Setor: ${this.currentFilters.setor}`);
    }
    if (this.currentFilters.keterangan) {
      filters.push(`Keterangan: ${this.currentFilters.keterangan}`);
    }

    return filters.length > 0
      ? filters.join(" | ")
      : "Semua Data (tanpa filter)";
  },
};

// Make laporan available globally
window.laporan = laporan;
