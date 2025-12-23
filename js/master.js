// Master data module
const master = {
  // Show master data form
  showMaster: async function (type) {
    setActiveNav(`master.showMaster('${type}')`);

    const titles = {
      kategori: "Kategori",
      setor: "Setor",
      keterangan: "Keterangan",
    };

    try {
      const data = await api.fetchData(
        `${CONFIG.SHEETS[`MASTER_${type.toUpperCase()}`]}!A2:A`
      );

      const content = `
                <h2 class="mb-4"><i class="fas fa-tags me-2"></i>Master ${
                  titles[type]
                }</h2>
                ${
                  !auth.isLoggedIn()
                    ? '<div class="alert alert-warning">Anda harus login untuk mengelola master data</div>'
                    : ""
                }
                
                <div class="row">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h5>Tambah ${titles[type]}</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="item-name-${type}" class="form-label">Nama ${
        titles[type]
      }</label>
                                    <input type="text" class="form-control" id="item-name-${type}" 
                                           placeholder="Masukkan nama ${titles[
                                             type
                                           ].toLowerCase()}">
                                </div>
                                <button type="button" onclick="master.addMasterItem('${type}')" 
                                        class="btn btn-primary" ${
                                          !auth.isLoggedIn() ? "disabled" : ""
                                        }>
                                    <i class="fas fa-plus me-2"></i>Tambah
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0">Daftar ${titles[type]}</h5>
                                    <small>Total: ${data.length} item</small>
                                </div>
                            </div>
                            <div class="card-body">
                                <div id="master-list-${type}" class="table-responsive">
                                    ${
                                      data.length > 0
                                        ? data
                                            .map(
                                              (item, index) => `
                                            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                                                <span>${item[0] || "-"}</span>
                                                <div>
                                                    <button onclick="master.editMasterItem('${type}', ${
                                                index + 2
                                              })" 
                                                            class="btn btn-sm btn-outline-primary me-1" ${
                                                              !auth.isLoggedIn()
                                                                ? "disabled"
                                                                : ""
                                                            }>
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button onclick="master.deleteMasterItem('${type}', ${
                                                index + 2
                                              })" 
                                                            class="btn btn-sm btn-outline-danger" ${
                                                              !auth.isLoggedIn()
                                                                ? "disabled"
                                                                : ""
                                                            }>
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        `
                                            )
                                            .join("")
                                        : '<div class="text-center py-3 text-muted">Belum ada data</div>'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      document.getElementById("content-area").innerHTML = content;
    } catch (error) {
      console.error(`Error loading master ${type}:`, error);
      utils.showError(`Error loading master data: ${error.message}`);
    }
  },

  // Add master item
  addMasterItem: async function (type) {
    if (!auth.isLoggedIn()) {
      alert("Harap login terlebih dahulu");
      return;
    }

    const itemName = document.getElementById(`item-name-${type}`).value.trim();
    if (!itemName) {
      alert("Nama item tidak boleh kosong");
      return;
    }

    const success = await api.appendData(
      `${CONFIG.SHEETS[`MASTER_${type.toUpperCase()}`]}!A:A`,
      [itemName]
    );

    if (success) {
      utils.showSuccess(`${itemName} berhasil ditambahkan`);
      document.getElementById(`item-name-${type}`).value = "";
      this.showMaster(type);
    }
  },

  // Edit master item (simplified - just prompt)
  editMasterItem: async function (type, rowIndex) {
    if (!auth.isLoggedIn()) {
      alert("Harap login terlebih dahulu");
      return;
    }

    const currentElement = document.querySelector(
      `#master-list-${type} .border-bottom:nth-child(${rowIndex - 1}) span`
    );
    if (!currentElement) {
      alert("Item tidak ditemukan");
      return;
    }

    const currentValue = currentElement.textContent;
    const newValue = prompt(`Edit nilai ${type}:`, currentValue);

    if (newValue && newValue !== currentValue) {
      const range = `${
        CONFIG.SHEETS[`MASTER_${type.toUpperCase()}`]
      }!A${rowIndex}`;
      const success = await api.updateData(range, [newValue.trim()]);

      if (success) {
        utils.showSuccess("Data berhasil diupdate");
        this.showMaster(type);
      }
    }
  },

  // Delete master item (clear cell)
  deleteMasterItem: async function (type, rowIndex) {
    if (!auth.isLoggedIn()) {
      alert("Harap login terlebih dahulu");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin menghapus item ini?")) {
      return;
    }

    const range = `${
      CONFIG.SHEETS[`MASTER_${type.toUpperCase()}`]
    }!A${rowIndex}`;
    const success = await api.updateData(range, [""]);

    if (success) {
      utils.showSuccess("Item berhasil dihapus");
      this.showMaster(type);
    }
  },
};

// Make master available globally
window.master = master;
