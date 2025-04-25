const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Pfad zur Datenbankdatei
const dbPath = path.resolve(__dirname, 'photoshare.db');

// Datenbankverbindung herstellen (erstellt die Datei, wenn sie nicht existiert)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Fehler beim Verbinden mit der SQLite-Datenbank:', err.message);
  } else {
    console.log('Erfolgreich mit der SQLite-Datenbank verbunden.');
    // Tabellen erstellen, wenn sie noch nicht existieren
    createTables();
  }
});

// Funktion zum Erstellen der Tabellen
function createTables() {
  db.serialize(() => {
    // Users-Tabelle
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error("Fehler beim Erstellen der 'users'-Tabelle:", err.message);
      } else {
        console.log("'users'-Tabelle erfolgreich erstellt oder bereits vorhanden.");
      }
    });

    // Albums-Tabelle
    db.run(`
      CREATE TABLE IF NOT EXISTS albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `, (err) => {
        if (err) {
            console.error("Fehler beim Erstellen der 'albums'-Tabelle:", err.message);
        } else {
            console.log("'albums'-Tabelle erfolgreich erstellt oder bereits vorhanden.");
        }
    });


    // Photos-Tabelle
    db.run(`
      CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        mimetype TEXT NOT NULL,
        size INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        album_id INTEGER,
        upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (album_id) REFERENCES albums (id) ON DELETE SET NULL
      )
    `, (err) => {
      if (err) {
        console.error("Fehler beim Erstellen der 'photos'-Tabelle:", err.message);
      } else {
        console.log("'photos'-Tabelle erfolgreich erstellt oder bereits vorhanden.");
      }
    });
  });
}

// Datenbankobjekt exportieren, damit es in anderen Teilen der Anwendung verwendet werden kann
module.exports = db;