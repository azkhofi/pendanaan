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

      // Display results
      this.displayReport(filteredData);
    } catch (error) {
      console.error("Error applying filters:", error);
      alert("Error menerapkan filter: " + error.message);
    }
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
            <div class="col-md-3 mb-3">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2">Total Data</h6>
                        <h3 class="card-title">${data.length}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2">Total Nominal</h6>
                        <h3 class="card-title">${utils.formatCurrency(
                          totalNominal
                        )}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2">Rata-rata</h6>
                        <h3 class="card-title">${utils.formatCurrency(
                          avgNominal
                        )}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card bg-warning text-dark">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2">Donatur Unik</h6>
                        <h3 class="card-title">${
                          [...new Set(data.map((row) => row[1]))].filter(
                            Boolean
                          ).length
                        }</h3>
                    </div>
                </div>
            </div>
        `;

    // Display data
    const html = data
      .reverse()
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
      const formattedData = exportData
        .reverse()
        .map((row) => [
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
    const printContent = document.getElementById("report-table").outerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = `
            <html>
                <head>
                    <title>Laporan Dana</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .total-row { font-weight: bold; background-color: #e9ecef; }
                    </style>
                </head>
                <body>
                    <h2>Laporan Dana</h2>
                    <p>Tanggal cetak: ${new Date().toLocaleDateString(
                      "id-ID"
                    )}</p>
                    ${printContent}
                </body>
            </html>
        `;

    window.print();
    document.body.innerHTML = originalContent;
    location.reload();
  },
};

// Make laporan available globally
window.laporan = laporan;
