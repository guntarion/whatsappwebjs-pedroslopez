const sqlite3 = require('sqlite3').verbose();

// Initialize the database
const db = new sqlite3.Database('./whatsappdb.sqlite', (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_lengkap TEXT NOT NULL,
        nama_panggilan TEXT,
        nama_whatsapp TEXT,
        institusi TEXT,
        gender TEXT CHECK(gender IN ('L', 'P')),
        nomer_handphone TEXT NOT NULL,
        email TEXT,
        alamat TEXT,
        kategori TEXT,
        status TEXT,
        chat TEXT,
        history TEXT,
        info_lain TEXT
        )
    `);
});
module.exports = db;
