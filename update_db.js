const db = require('./database');

// Überprüfen, ob die Spalte created_at in der photos-Tabelle existiert
db.all("PRAGMA table_info(photos)", [], (err, rows) => {
    if (err) {
        console.error("Fehler beim Überprüfen der Tabelle:", err.message);
        return;
    }
    
    // Spalte hinzufügen, wenn sie nicht existiert
    const hasCreatedAt = rows.some(row => row.name === 'created_at');
    if (!hasCreatedAt) {
        console.log("Füge created_at Spalte zur photos-Tabelle hinzu...");
        db.run("ALTER TABLE photos ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP", (err) => {
            if (err) {
                console.error("Fehler beim Hinzufügen der Spalte:", err.message);
            } else {
                console.log("Spalte created_at erfolgreich hinzugefügt!");
            }
        });
    } else {
        console.log("Die Spalte created_at existiert bereits in der photos-Tabelle.");
    }
    
    // Überprüfen, ob mimetype eine NOT NULL Einschränkung hat
    const mimetypeColumn = rows.find(row => row.name === 'mimetype');
    if (mimetypeColumn && mimetypeColumn.notnull === 1) {
        console.log("Ändere mimetype-Spalte, um NULL-Werte zu erlauben...");
        
        // In SQLite können wir die Spalte nicht direkt ändern, wir müssen:
        // 1. Eine temporäre Tabelle erstellen
        // 2. Daten kopieren
        // 3. Alte Tabelle löschen
        // 4. Neue Tabelle umbenennen
        
        db.serialize(() => {
            // Sichern der aktuellen Tabellendefinition (ohne die NOT NULL Einschränkung)
            db.run("CREATE TABLE photos_temp AS SELECT * FROM photos", (err) => {
                if (err) {
                    console.error("Fehler beim Erstellen der temporären Tabelle:", err.message);
                    return;
                }
                
                // Löschen der alten Tabelle
                db.run("DROP TABLE photos", (err) => {
                    if (err) {
                        console.error("Fehler beim Löschen der alten Tabelle:", err.message);
                        return;
                    }
                    
                    // Erstellen der neuen Tabelle mit der gleichen Struktur, aber ohne NOT NULL für mimetype
                    db.run(`CREATE TABLE photos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        filename TEXT NOT NULL,
                        filepath TEXT,
                        size INTEGER,
                        mimetype TEXT,
                        user_id INTEGER,
                        album_id INTEGER,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id),
                        FOREIGN KEY (album_id) REFERENCES albums (id)
                    )`, (err) => {
                        if (err) {
                            console.error("Fehler beim Erstellen der neuen Tabelle:", err.message);
                            return;
                        }
                        
                        // Kopieren der Daten zurück
                        db.run("INSERT INTO photos SELECT * FROM photos_temp", (err) => {
                            if (err) {
                                console.error("Fehler beim Kopieren der Daten:", err.message);
                                return;
                            }
                            
                            // Löschen der temporären Tabelle
                            db.run("DROP TABLE photos_temp", (err) => {
                                if (err) {
                                    console.error("Fehler beim Löschen der temporären Tabelle:", err.message);
                                } else {
                                    console.log("mimetype-Spalte erfolgreich geändert, um NULL-Werte zu erlauben!");
                                }
                            });
                        });
                    });
                });
            });
        });
    }
});

// Überprüfen, ob die photo_permissions-Tabelle existiert
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='photo_permissions'", [], (err, row) => {
    if (err) {
        console.error("Fehler beim Überprüfen der Tabellen:", err.message);
        return;
    }
    
    if (!row) {
        console.log("Erstelle photo_permissions-Tabelle...");
        db.run(`
            CREATE TABLE photo_permissions (
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
                console.error("Fehler beim Erstellen der photo_permissions-Tabelle:", err.message);
            } else {
                console.log("photo_permissions-Tabelle erfolgreich erstellt!");
            }
        });
    } else {
        console.log("Die photo_permissions-Tabelle existiert bereits.");
    }
});