const express = require('express');
const path = require('path');
const db = require('./database'); // Importiere die Datenbankverbindung
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session); // Session Store
const bcrypt = require('bcrypt'); // For password hashing
const multer = require('multer'); // Importiere multer
const fs = require('fs'); // Filesystem-Modul für Ordnererstellung

const app = express();
const port = process.env.PORT || 3500; // Use environment variable for port

// Stelle sicher, dass der Uploads-Ordner existiert
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
    console.log(`Uploads-Verzeichnis erstellt unter: ${uploadsDir}`);
}

// Multer-Konfiguration für Dateispeicherung
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir); // Speichere Dateien im 'uploads'-Ordner
    },
    filename: function (req, file, cb) {
        // Eindeutigen Dateinamen generieren (z.B. timestamp + originalname)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// Optional: Dateifilter (nur Bilder erlauben)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Akzeptiere die Datei
    } else {
        cb(new Error('Nur Bilddateien sind erlaubt!'), false); // Lehne die Datei ab
    }
};

// Multer-Middleware-Instanz erstellen
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 10 }, // Limit auf 10MB (optional)
    fileFilter: fileFilter
});

// Statische Dateien bereitstellen
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from node_modules for libraries like Lightbox
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Session Middleware Configuration



app.use(session({
    store: new SQLiteStore({
        db: 'photoshare.db', // Name der Datenbankdatei
        dir: __dirname, // Verzeichnis der Datenbankdatei
        table: 'sessions' // Name der Session-Tabelle
    }),
    secret: process.env.SESSION_SECRET || 'replace_this_with_a_very_strong_random_secret_key_at_least_32_chars_long', // WICHTIG: Ändere dies in einen starken, geheimen Schlüssel!
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // Gültigkeit des Cookies (hier: 1 Tag)
        // secure: true // Nur aktivieren, wenn HTTPS verwendet wird
    }
}));


// Middleware für das Parsen von JSON-Request-Bodies
app.use(express.json());
// Middleware für das Parsen von URL-kodierten Request-Bodies
app.use(express.urlencoded({ extended: true }));

// --- Middleware zur Überprüfung der Authentifizierung ---
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        // Benutzer ist eingeloggt, fahre mit der nächsten Middleware/Route fort
        return next();
    } else {
        // Benutzer ist nicht eingeloggt
        // Send a 401 Unauthorized status
        return res.status(401).json({ message: 'Nicht autorisiert. Bitte einloggen.' });
    }
};

// --- Authentifizierungs-Routen ---

// Registrierung (POST /api/auth/register)
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Einfache Validierung (kann erweitert werden)
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Benutzername, E-Mail und Passwort sind erforderlich.' });
    }

    try {
        // Passwort hashen
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Benutzer in die Datenbank einfügen
        const sql = 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)';
        db.run(sql, [username, email, passwordHash], function(err) {
            if (err) {
                // Fehlerbehandlung (z.B. wenn Benutzername/E-Mail bereits existiert)
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ message: 'Benutzername oder E-Mail bereits vergeben.' });
                }
                console.error('Fehler bei der Registrierung:', err.message);
                return res.status(500).json({ message: 'Fehler bei der Registrierung.' });
            }
            console.log(`Neuer Benutzer registriert mit ID: ${this.lastID}`);
            res.status(201).json({ message: 'Benutzer erfolgreich registriert.', userId: this.lastID });
        });

    } catch (error) {
        console.error('Fehler beim Passwort-Hashing:', error);
        res.status(500).json({ message: 'Interner Serverfehler.' });
    }
});

// Login (POST /api/auth/login)
app.post('/api/auth/login', async (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
        return res.status(400).json({ message: 'Benutzername/E-Mail und Passwort sind erforderlich.' });
    }

    try {
        const sql = 'SELECT * FROM users WHERE username = ? OR email = ?';
        db.get(sql, [usernameOrEmail, usernameOrEmail], async (err, user) => {
            if (err) {
                console.error('Datenbankfehler beim Login:', err.message);
                return res.status(500).json({ message: 'Ein interner Serverfehler ist aufgetreten.' });
            }
            if (!user) {
                return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
            }

            // Passwort vergleichen
            const match = await bcrypt.compare(password, user.password_hash);
            if (match) {
                // Session erstellen
                req.session.userId = user.id;
                req.session.username = user.username;
                return res.json({ message: 'Login erfolgreich.', user: { id: user.id, username: user.username } });
            } else {
                return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
            }
        });
    } catch (error) {
        console.error('Fehler beim Login:', error.message);
        return res.status(500).json({ message: 'Ein interner Serverfehler ist aufgetreten.' });
    }
});

// Logout (POST /api/auth/logout)
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Fehler beim Logout:', err);
            return res.status(500).json({ message: 'Logout fehlgeschlagen.' });
        }
        res.clearCookie('connect.sid'); // Cookie löschen (Name hängt von Session-Konfiguration ab)
        res.status(200).json({ message: 'Logout erfolgreich.' });
    });
});

// --- Ende Authentifizierungs-Routen ---

// --- Foto-Routen (Beispiel für geschützte Route) ---

// Beispiel: Route, um eigene Benutzerdaten abzurufen (geschützt)
app.get('/api/users/me', isAuthenticated, (req, res) => {
    // Dank isAuthenticated wissen wir hier, dass req.session.userId existiert
    const userId = req.session.userId;
    const sql = "SELECT id, username, email, created_at FROM users WHERE id = ?";
    db.get(sql, [userId], (err, user) => {
        if (err) {
            console.error("Fehler beim Abrufen der Benutzerdaten:", err.message);
            return res.status(500).json({ message: "Fehler beim Abrufen der Benutzerdaten." });
        }
        if (!user) {
            // Sollte nicht passieren, wenn die Session gültig ist, aber sicher ist sicher
            return res.status(404).json({ message: "Benutzer nicht gefunden." });
        }
        res.status(200).json(user);
    });
});

// --- Album Routen ---

// Neues Album erstellen (POST /api/albums)
app.post('/api/albums', isAuthenticated, async (req, res) => {
    const { name } = req.body;
    const userId = req.session.userId;

    if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Albumname ist erforderlich.' });
    }

    try {
        const sql = 'INSERT INTO albums (name, user_id) VALUES (?, ?)';
        db.run(sql, [name.trim(), userId], function(err) {
            if (err) {
                console.error('Fehler beim Erstellen des Albums:', err.message);
                return res.status(500).json({ message: 'Album konnte nicht erstellt werden.' });
            }
            res.status(201).json({ message: 'Album erfolgreich erstellt.', album: { id: this.lastID, name: name.trim(), user_id: userId } });
        });
    } catch (error) {
        console.error('Fehler beim Erstellen des Albums:', error);
        res.status(500).json({ message: 'Ein interner Serverfehler ist aufgetreten.' });
    }
});

// Alben des aktuellen Benutzers abrufen (GET /api/albums)
app.get('/api/albums', isAuthenticated, async (req, res) => {
    const userId = req.session.userId;
    try {
        const sql = 'SELECT id, name, user_id, created_at FROM albums WHERE user_id = ? ORDER BY created_at DESC';
        db.all(sql, [userId], (err, albums) => {
            if (err) {
                console.error('Fehler beim Abrufen der Alben:', err.message);
                return res.status(500).json({ message: 'Alben konnten nicht abgerufen werden.' });
            }
            res.json(albums);
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Alben:', error);
        res.status(500).json({ message: 'Ein interner Serverfehler ist aufgetreten.' });
    }
});

// Fotos innerhalb eines bestimmten Albums des Benutzers abrufen (GET /api/albums/:albumId/photos)
app.get('/api/albums/:albumId/photos', isAuthenticated, async (req, res) => {
    const userId = req.session.userId;
    const albumId = parseInt(req.params.albumId, 10);

    if (isNaN(albumId)) {
        return res.status(400).json({ message: 'Ungültige Album-ID.' });
    }

    try {
        // Zuerst prüfen, ob das Album dem Benutzer gehört
        const albumCheckSql = 'SELECT id FROM albums WHERE id = ? AND user_id = ?';
        db.get(albumCheckSql, [albumId, userId], (err, album) => {
            if (err) {
                console.error('Fehler beim Überprüfen des Albums:', err.message);
                return res.status(500).json({ message: 'Fehler beim Abrufen der Fotos.' });
            }
            if (!album) {
                return res.status(404).json({ message: 'Album nicht gefunden oder Zugriff verweigert.' });
            }

            // Wenn das Album dem Benutzer gehört, Fotos abrufen
            const photosSql = `
                SELECT p.id, p.filename, p.user_id, p.album_id, p.created_at, u.username 
                FROM photos p
                JOIN users u ON p.user_id = u.id
                WHERE p.album_id = ? AND p.user_id = ? 
                ORDER BY p.created_at DESC
            `;
            db.all(photosSql, [albumId, userId], (err, photos) => {
                if (err) {
                    console.error('Fehler beim Abrufen der Fotos aus dem Album:', err.message);
                    return res.status(500).json({ message: 'Fotos konnten nicht abgerufen werden.' });
                }
                res.json(photos);
            });
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Fotos aus dem Album:', error);
        res.status(500).json({ message: 'Ein interner Serverfehler ist aufgetreten.' });
    }
});


// --- Foto-Routen ---

// Foto hochladen (POST /api/photos/upload) - jetzt mit album_id
app.post('/api/photos/upload', isAuthenticated, upload.single('photo'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Keine Datei hochgeladen.' });
    }
    
    const { album_id } = req.body; // Album-ID aus dem Request-Body holen
    const userId = req.session.userId;
    const filename = req.file.filename;

    if (!album_id) {
        // Lösche die hochgeladene Datei, wenn keine Album-ID angegeben wurde, um verwaiste Dateien zu vermeiden
        fs.unlink(path.join(uploadsDir, filename), (err) => {
            if (err) console.error("Fehler beim Löschen der Datei nach fehlender album_id:", err);
        });
        return res.status(400).json({ message: 'Album-ID ist erforderlich.' });
    }
    
    // Überprüfen, ob das Album dem Benutzer gehört
    const albumCheckSql = 'SELECT id FROM albums WHERE id = ? AND user_id = ?';
    db.get(albumCheckSql, [album_id, userId], (err, album) => {
        if (err) {
            console.error('Fehler beim Überprüfen des Albums vor dem Hochladen:', err.message);
            fs.unlink(path.join(uploadsDir, filename), (unlinkErr) => { if (unlinkErr) console.error("Fehler beim Löschen der Datei nach DB-Fehler:", unlinkErr); });
            return res.status(500).json({ message: 'Fehler beim Hochladen des Fotos.' });
        }
        if (!album) {
            fs.unlink(path.join(uploadsDir, filename), (unlinkErr) => { if (unlinkErr) console.error("Fehler beim Löschen der Datei nach ungültigem Album:", unlinkErr); });
            return res.status(403).json({ message: 'Zugriff auf das Album verweigert oder Album nicht gefunden.' });
        }

        // Album gehört dem Benutzer, Foto in DB speichern
        const sql = 'INSERT INTO photos (filename, user_id, album_id) VALUES (?, ?, ?)';
        db.run(sql, [filename, userId, album_id], function(err) {
            if (err) {
                console.error('Fehler beim Speichern des Fotos in der DB:', err.message);
                // Lösche die hochgeladene Datei bei DB-Fehler
                fs.unlink(path.join(uploadsDir, filename), (unlinkErr) => {
                    if (unlinkErr) console.error("Fehler beim Löschen der Datei nach DB-Insert-Fehler:", unlinkErr);
                });
                return res.status(500).json({ message: 'Foto konnte nicht in der Datenbank gespeichert werden.' });
            }
            res.status(201).json({ message: 'Foto erfolgreich hochgeladen.', photo: { id: this.lastID, filename, user_id: userId, album_id } });
        });
    });
});

// Alle eigenen Fotos des Benutzers abrufen (GET /api/photos/my)
// Diese Route könnte nun alle Fotos des Benutzers über alle seine Alben hinweg zurückgeben
// oder spezifischer sein, je nach Anforderung.
// Fürs Erste lassen wir sie so, dass sie alle Fotos des Benutzers zurückgibt.
// Die clientseitige Logik muss dann entscheiden, wie sie diese anzeigt (z.B. gruppiert nach Album).
app.get('/api/photos/my', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    // SQL-Query, um Fotos zusammen mit Album-Namen und Benutzernamen abzurufen
    const sql = `
        SELECT p.id, p.filename, p.user_id, p.album_id, p.created_at, u.username, a.name as album_name
        FROM photos p
        JOIN users u ON p.user_id = u.id
        JOIN albums a ON p.album_id = a.id
        WHERE p.user_id = ? 
        ORDER BY p.created_at DESC
    `;
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error('Fehler beim Abrufen meiner Fotos:', err.message);
            return res.status(500).json({ message: 'Fehler beim Abrufen der Fotos.' });
        }
        res.json(rows);
    });
});


// Alle Fotos von allen Benutzern abrufen (GET /api/photos/all)
// ACHTUNG: Diese Route gibt ALLE Fotos von ALLEN Benutzern zurück.
// In einer echten Anwendung benötigen Sie hier möglicherweise eine Paginierung und/oder
// eine Unterscheidung zwischen öffentlichen und privaten Alben/Fotos.
// Für dieses Projekt könnte es sinnvoll sein, nur Fotos aus Alben anzuzeigen,
// die als "öffentlich" markiert sind (erfordert Schemaänderung) oder
// die Logik hier anzupassen, um die Privatsphäre zu wahren.
// Vorerst: Gibt alle Fotos mit User- und Albuminformationen zurück.
app.get('/api/photos/all', isAuthenticated, (req, res) => { // isAuthenticated hier, um Kontext zu haben, wer anfragt
    const sql = `
        SELECT p.id, p.filename, p.user_id, p.album_id, p.created_at, u.username, a.name as album_name
        FROM photos p
        JOIN users u ON p.user_id = u.id
        JOIN albums a ON p.album_id = a.id
        ORDER BY p.created_at DESC
    `;
    // Optional: Fügen Sie ein LIMIT hinzu, um die Anzahl der Ergebnisse zu begrenzen, z.B. LIMIT 50
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Fehler beim Abrufen aller Fotos:', err.message);
            return res.status(500).json({ message: 'Fehler beim Abrufen aller Fotos.' });
        }
        res.json(rows);
    });
});


// Foto löschen (DELETE /api/photos/:photoId)
app.delete('/api/photos/:photoId', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const photoId = req.params.photoId;

    // 1. Fotoinformationen abrufen (inkl. Dateipfad und Besitzer)
    const findSql = "SELECT filepath, user_id FROM photos WHERE id = ?";
    db.get(findSql, [photoId], (err, photo) => {
        if (err) {
            console.error("Fehler beim Suchen des Fotos:", err.message);
            return res.status(500).json({ message: "Fehler beim Löschen des Fotos." });
        }

        if (!photo) {
            return res.status(404).json({ message: "Foto nicht gefunden." });
        }

        // 2. Überprüfen, ob der eingeloggte Benutzer der Besitzer ist
        if (photo.user_id !== userId) {
            return res.status(403).json({ message: "Nicht autorisiert, dieses Foto zu löschen." });
        }

        // 3. Foto aus der Datenbank löschen
        const deleteSql = "DELETE FROM photos WHERE id = ? AND user_id = ?";
        db.run(deleteSql, [photoId, userId], function(err) {
            if (err) {
                console.error("Fehler beim Löschen des Fotos aus der DB:", err.message);
                return res.status(500).json({ message: "Fehler beim Löschen des Fotos." });
            }

            if (this.changes === 0) {
                // Sollte nicht passieren wegen der vorherigen Prüfung, aber sicher ist sicher
                return res.status(404).json({ message: "Foto nicht gefunden oder gehört nicht Ihnen." });
            }

            // 4. (Optional aber empfohlen) Foto aus dem Dateisystem löschen
            if (photo.filepath) {
                fs.unlink(photo.filepath, (unlinkErr) => {
                    if (unlinkErr) {
                        // Loggen Sie den Fehler, aber senden Sie trotzdem eine Erfolgsmeldung,
                        // da der DB-Eintrag entfernt wurde.
                        console.error(`Fehler beim Löschen der Datei ${photo.filepath}:`, unlinkErr.message);
                    } else {
                        console.log(`Datei ${photo.filepath} erfolgreich gelöscht.`);
                    }
                });
            }

            res.status(200).json({ message: "Foto erfolgreich gelöscht." });
        });
    });
});


// Server starten
app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});