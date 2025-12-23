// Google Sheets API functions
const api = {
  // Fetch data from sheet
  fetchData: async function (range) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${range}?key=${CONFIG.API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error("Error fetching data:", error);
      return [];
    }
  },

  // Append data to sheet
  appendData: async function (range, values) {
    if (!auth.accessToken) {
      alert("Harap login terlebih dahulu untuk menambah data");
      return false;
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [values],
          range: range,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Data appended:", result);
      return true;
    } catch (error) {
      console.error("Error appending data:", error);

      // Check if token expired
      if (
        error.message.includes("invalid_token") ||
        error.message.includes("401")
      ) {
        alert("Session expired. Silakan login kembali.");
        auth.logout();
      } else {
        alert("Error menambah data: " + error.message);
      }

      return false;
    }
  },

  // Update data in sheet
  updateData: async function (range, values) {
    if (!auth.accessToken) {
      alert("Harap login terlebih dahulu untuk mengupdate data");
      return false;
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [values],
          range: range,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || `HTTP error! status: ${response.status}`
        );
      }

      return true;
    } catch (error) {
      console.error("Error updating data:", error);
      alert("Error mengupdate data: " + error.message);
      return false;
    }
  },

  // Fetch all data with multiple ranges
  fetchMultipleRanges: async function (ranges) {
    try {
      const rangeParam = ranges.map((r) => `ranges=${r}`).join("&");
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values:batchGet?${rangeParam}&key=${CONFIG.API_KEY}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.valueRanges || [];
    } catch (error) {
      console.error("Error fetching multiple ranges:", error);
      return [];
    }
  },
};

// Make api available globally
window.api = api;
