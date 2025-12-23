// Configuration file - Edit these values
const CONFIG = {
  SPREADSHEET_ID: "153Y2Uvw-9p14AexTXr5PkFpif2SjYT4RZ_7FNPZYbtY",
  CLIENT_ID: "1046860692698-rvm0o1ffentv90mkl50r8rammkeu2r8q.apps.googleusercontent.com",
  API_KEY: "AIzaSyDhgQ2nqwurITCU8oe2nJkerxxDk4s9W1E",

  // Sheet names
  SHEETS: {
    DANA: "dana",
    MASTER_KATEGORI: "master_kategori",
    MASTER_SETOR: "master_setor",
    MASTER_KETERANGAN: "master_keterangan",
  },

   // Google Drive Config
  GOOGLE: {
    CLIENT_ID: '1046860692698-4ji8ec2m9pcoierugui2t8rtnps2g635.apps.googleusercontent.com',
    API_KEY: 'AIzaSyDhgQ2nqwurITCU8oe2nJkerxxDk4s9W1E', // Optional
    SCOPES: 'https://www.googleapis.com/auth/drive.file',
    FOLDER_NAME: 'Bukti Setoran Dana'
  },
  
  // API Base URL untuk Google Sheets API
  API_BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets'
};  

// Make config available globally
window.CONFIG = CONFIG;
