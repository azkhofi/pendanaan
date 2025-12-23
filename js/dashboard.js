// Dashboard module
async function showDashboard() {
  setActiveNav("showDashboard");

  const content = `
        <div class="animate__animated animate__fadeIn">
            <h2 class="mb-4"><i class="fas fa-tachometer-alt me-2"></i>Dashboard</h2>
            <div class="alert ${
              auth.isLoggedIn() ? "alert-success" : "alert-warning"
            } animate__animated animate__fadeInDown">
                <strong>Status:</strong> ${
                  auth.isLoggedIn()
                    ? "Login aktif (bisa edit)"
                    : "Hanya view (login untuk edit)"
                }
            </div>
            
            <!-- Statistics Cards -->
            <div class="row" id="stats-cards">
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card bg-primary text-white stat-card animate__animated animate__fadeInLeft">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2"><i class="fas fa-money-bill-wave me-1"></i>Total Dana Masuk</h6>
                            <h3 id="total-dana" class="card-title">Loading...</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card bg-success text-white stat-card animate__animated animate__fadeInLeft" style="animation-delay: 0.1s">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2"><i class="fas fa-list me-1"></i>Jumlah Transaksi</h6>
                            <h3 id="total-transaksi" class="card-title">Loading...</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card bg-info text-white stat-card animate__animated animate__fadeInLeft" style="animation-delay: 0.2s">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2"><i class="fas fa-users me-1"></i>Donatur Unik</h6>
                            <h3 id="total-donatur" class="card-title">Loading...</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card bg-warning text-dark stat-card animate__animated animate__fadeInLeft" style="animation-delay: 0.3s">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2"><i class="fas fa-tags me-1"></i>Jumlah Kategori</h6>
                            <h3 id="total-kategori" class="card-title">Loading...</h3>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Kategori Breakdown -->
            <div class="row mt-4" id="kategori-section" style="display: none;">
                <div class="col-md-12">
                    <div class="card animate__animated animate__fadeInUp">
                        <div class="card-header">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0"><i class="fas fa-chart-pie me-2"></i>Donasi per Kategori</h5>
                                <button onclick="updateDashboardStats()" class="btn btn-sm btn-outline-primary">
                                    <i class="fas fa-sync-alt me-1"></i>Refresh
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>Kategori</th>
                                            <th>Jumlah Transaksi</th>
                                            <th>Total Dana</th>
                                            <th>Persentase</th>
                                        </tr>
                                    </thead>
                                    <tbody id="kategori-breakdown">
                                        <tr><td colspan="4" class="text-center">Loading...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Recent Transactions -->
            <div class="row mt-4">
                <div class="col-md-12">
                    <div class="card animate__animated animate__fadeInUp">
                        <div class="card-header">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0"><i class="fas fa-history me-2"></i>10 Transaksi Terbaru</h5>
                                <button onclick="updateDashboardStats()" class="btn btn-sm btn-outline-primary">
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
                                        </tr>
                                    </thead>
                                    <tbody id="recent-transactions">
                                        <tr><td colspan="7" class="text-center">Loading...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.getElementById("content-area").innerHTML = content;
  document.getElementById("content-area").style.animation = "fadeIn 0.5s ease";
  await updateDashboardStats();
}

// Update dashboard statistics
// dashboard.js - Versi Sempurna
async function updateDashboardStats() {
  try {
    console.log("updateDashboardStats() called");
    
    // Show loading animation on stats cards only if elements exist
    const statsCards = document.querySelectorAll("#stats-cards .card-title");
    if (statsCards.length > 0) {
      statsCards.forEach((el) => {
        if (el && !el.innerHTML.includes("fa-spinner")) {
          const originalText = el.textContent;
          el.setAttribute("data-original", originalText);
          el.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>';
        }
      });
    }

    const data = await api.fetchData(`${CONFIG.SHEETS.DANA}!A2:G`);
    console.log("Data received:", data.length, "rows");

    // Restore original text if no data
    if (!data || data.length === 0) {
      console.log("No data found");
      setDefaultStats();
      return;
    }

    // Calculate total donations
    const total = data.reduce((sum, row) => {
      const nominal = parseFloat(row[3]) || 0;
      return sum + nominal;
    }, 0);

    // Count unique donors
    const donors = [...new Set(data.map((row) => row[1]?.trim()))].filter(Boolean);
    
    // Count unique categories and calculate per category
    const kategoriMap = {};
    data.forEach(row => {
      const kategori = (row[2] || "Tidak Diketahui").trim();
      const nominal = parseFloat(row[3]) || 0;
      
      if (!kategoriMap[kategori]) {
        kategoriMap[kategori] = {
          count: 0,
          total: 0
        };
      }
      
      kategoriMap[kategori].count++;
      kategoriMap[kategori].total += nominal;
    });
    
    const totalKategori = Object.keys(kategoriMap).length;

    console.log("Calculated stats:", {
      total,
      donors: donors.length,
      categories: totalKategori,
      transactions: data.length
    });

    // Update UI with animation
    const stats = [
      { id: "total-dana", value: utils.formatCurrency(total) },
      { id: "total-transaksi", value: data.length.toLocaleString() },
      { id: "total-donatur", value: donors.length.toLocaleString() },
      { id: "total-kategori", value: totalKategori.toLocaleString() },
    ];

    stats.forEach((stat, index) => {
      setTimeout(() => {
        const element = document.getElementById(stat.id);
        if (element) {
          element.textContent = stat.value;
          element.classList.add("animate__animated", "animate__pulse");
          setTimeout(() => {
            element.classList.remove("animate__animated", "animate__pulse");
          }, 500);
        } else {
          console.warn(`Element #${stat.id} not found`);
        }
      }, index * 100);
    });
    
    // Show kategori breakdown if there are categories
    const kategoriSection = document.getElementById("kategori-section");
    const kategoriBreakdown = document.getElementById("kategori-breakdown");
    
    if (kategoriSection && totalKategori > 0) {
      kategoriSection.style.display = "block";
      
      // Sort categories by total amount (descending)
      const sortedKategori = Object.entries(kategoriMap).sort((a, b) => b[1].total - a[1].total);
      
      if (kategoriBreakdown) {
        const kategoriHtml = sortedKategori
          .map(([kategori, data], index) => {
            const persentase = total > 0 ? ((data.total / total) * 100).toFixed(1) : 0;
            
            return `
                <tr class="animate__animated animate__fadeInUp" style="animation-delay: ${index * 0.05}s">
                    <td><span class="badge bg-primary">${kategori}</span></td>
                    <td>${data.count.toLocaleString()}</td>
                    <td><strong>${utils.formatCurrency(data.total)}</strong></td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="progress flex-grow-1 me-2" style="height: 10px;">
                                <div class="progress-bar bg-success" role="progressbar" 
                                     style="width: ${persentase}%" 
                                     aria-valuenow="${persentase}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="100">
                                </div>
                            </div>
                            <span>${persentase}%</span>
                        </div>
                    </td>
                </tr>
            `;
          })
          .join("");
        
        kategoriBreakdown.innerHTML = kategoriHtml || '<tr><td colspan="4" class="text-center">No data</td></tr>';
      }
    } else if (kategoriSection) {
      kategoriSection.style.display = "none";
    }

    // Show recent transactions
    const recentContainer = document.getElementById("recent-transactions");
    if (recentContainer) {
      const recent = data.slice(-10).reverse();
      const recentHtml = recent
        .map(
          (row, index) => `
                <tr class="animate__animated animate__fadeInUp" style="animation-delay: ${index * 0.05}s">
                    <td>${utils.formatDate(row[0])}</td>
                    <td>${row[1] || "-"}</td>
                    <td><span class="badge bg-primary">${row[2] || "-"}</span></td>
                    <td><strong>${utils.formatCurrency(row[3])}</strong></td>
                    <td>${row[4] || "-"}</td>
                    <td><span class="badge bg-secondary">${row[5] || "-"}</span></td>
                    <td>${utils.truncateText(row[6] || "-", 30)}</td>
                </tr>
            `
        )
        .join("");

      recentContainer.innerHTML = recentHtml || '<tr><td colspan="7" class="text-center">No recent transactions</td></tr>';
    }

    // Add success animation to all updated elements
    setTimeout(() => {
      document.querySelectorAll("#stats-cards .card-title").forEach(el => {
        el.classList.add("text-success");
        setTimeout(() => {
          el.classList.remove("text-success");
        }, 1000);
      });
    }, 500);

  } catch (error) {
    console.error("Error updating dashboard:", error);
    setErrorState(error.message || "Unknown error occurred");
  }
}

// Helper function to set default stats
function setDefaultStats() {
  const defaultStats = [
    { id: "total-dana", value: "Rp 0" },
    { id: "total-transaksi", value: "0" },
    { id: "total-donatur", value: "0" },
    { id: "total-kategori", value: "0" },
  ];

  defaultStats.forEach(stat => {
    const element = document.getElementById(stat.id);
    if (element) {
      element.textContent = stat.value;
    }
  });

  const recentContainer = document.getElementById("recent-transactions");
  if (recentContainer) {
    recentContainer.innerHTML = `
      <tr class="animate__animated animate__fadeIn">
        <td colspan="7" class="text-center text-muted py-4">
          <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
          Belum ada data transaksi
        </td>
      </tr>
    `;
  }

  const kategoriSection = document.getElementById("kategori-section");
  if (kategoriSection) {
    kategoriSection.style.display = "none";
  }
}

// Helper function to set error state
function setErrorState(errorMessage) {
  console.error("Dashboard error:", errorMessage);
  
  const statsCards = document.querySelectorAll("#stats-cards .card-title");
  statsCards.forEach(el => {
    if (el && el.hasAttribute("data-original")) {
      el.textContent = el.getAttribute("data-original");
    } else {
      el.textContent = "Error";
    }
    el.classList.add("text-danger");
  });

  const recentContainer = document.getElementById("recent-transactions");
  if (recentContainer) {
    recentContainer.innerHTML = `
      <tr class="animate__animated animate__shakeX">
        <td colspan="7" class="text-center text-danger py-4">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error loading data
        </td>
      </tr>
    `;
  }
}

// Initialize dashboard on page load
if (document.getElementById("dashboard-content")) {
  document.addEventListener("DOMContentLoaded", function() {
    console.log("Dashboard initialized");
    updateDashboardStats();
  });
}

// Make function globally available
window.updateDashboardStats = updateDashboardStats;