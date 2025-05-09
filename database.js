const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Pfad zur Datenbankdatei
const dbPath = path.resolve(__dirname, 'photoshare.db');

// Datenbankverbindung herstellen (erstellt die Datei, wenn sie nicht existiert)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Fehler beim Verbinden mit der SQLite-Datenbank:', err.message);
    // Es ist wichtig, hier möglicherweise den Prozess zu beenden oder einen Fehler auszulösen,
    // da die Anwendung ohne Datenbankverbindung wahrscheinlich nicht korrekt funktioniert.
    // throw err; // Oder process.exit(1);
  } else {
    console.log('Erfolgreich mit der SQLite-Datenbank verbunden.');
    // Tabellen erstellen, wenn sie noch nicht existieren
    createTables();
  }
});

// Exportiere die db-Instanz SOFORT.
// server.js erhält diese Instanz, auch wenn die Verbindung und Tabellenerstellung noch laufen.
// Die sqlite3-Bibliothek puffert Befehle, bis die Verbindung hergestellt ist.
module.exports = db;

// Funktion zum Erstellen der Tabellen
function createTables() {
  db.serialize(() => {
    // Benutzertabelle erstellen
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Fehler beim Erstellen der users-Tabelle:', err.message);
        } else {
            console.log('Users-Tabelle erfolgreich erstellt oder bereits vorhanden.');
        }
    });

    // Albumtabelle erstellen
    db.run(`CREATE TABLE IF NOT EXISTS albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) {
            console.error('Fehler beim Erstellen der albums-Tabelle:', err.message);
        } else {
            console.log('Albums-Tabelle erfolgreich erstellt oder bereits vorhanden.');
        }
    });

    // Fototabelle erstellen, jetzt mit album_id
    db.run(`CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        album_id INTEGER NOT NULL, 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) {
            console.error('Fehler beim Erstellen der photos-Tabelle:', err.message);
        } else {
            console.log('Photos-Tabelle erfolgreich erstellt oder bereits vorhanden.');
        }
    });

    // Session-Tabelle (wird von connect-sqlite3 verwaltet, aber hier zur Info)
    // Die Struktur wird automatisch von connect-sqlite3 erstellt, wenn sie nicht existiert.
    // Es ist nicht notwendig, sie hier manuell zu definieren, es sei denn,
    // Sie möchten spezifische Indizes oder Constraints hinzufügen, was selten der Fall ist.
    // console.log('Session-Tabelle wird von connect-sqlite3 verwaltet.');

  }); // Diese Klammer schließt db.serialize()

  // module.exports = db; // HIER ENTFERNEN
} // Diese Klammer schließt createTables()
// Die überflüssige Klammer wurde hier entfernt.