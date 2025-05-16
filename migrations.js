const db = require('./database');

// Erstelle die photo_permissions Tabelle
db.run(`
    CREATE TABLE IF NOT EXISTS photo_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        photo_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        permission_type TEXT DEFAULT 'view',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (photo_id) REFERENCES photos (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE (photo_id, user_id)
    )
`, (err) => {
    if (err) {
        console.error('Fehler beim Erstellen der photo_permissions Tabelle:', err.message);
    } else {
        console.log('photo_permissions Tabelle erfolgreich erstellt oder existiert bereits.');
    }
});