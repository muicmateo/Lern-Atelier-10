const express = require('express');
const path = require('path');
const db = require('./database'); // Importiere die Datenbankverbindung
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session); // Session Store
const bcrypt = require('bcrypt'); // For password hashing
const multer = require('multer'); // Importiere multer
const fs = require('fs'); // Filesystem-Modul für Ordnererstellung

const app = express();
const port = 3500;

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
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session Middleware Configuration
app.use(session({
    store: new SQLiteStore({
        db: 'photoshare.db', // Name der Datenbankdatei
        dir: __dirname, // Verzeichnis der Datenbankdatei
        table: 'sessions' // Name der Session-Tabelle
    }),
    secret: 'your_secret_key', // WICHTIG: Ändere dies in einen starken, geheimen Schlüssel!
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
app.post('/api/auth/login', (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
        return res.status(400).json({ message: 'Benutzername/E-Mail und Passwort sind erforderlich.' });
    }

    // Benutzer in der Datenbank suchen (nach Username oder Email)
    const sql = 'SELECT * FROM users WHERE username = ? OR email = ?';
    db.get(sql, [usernameOrEmail, usernameOrEmail], async (err, user) => {
        if (err) {
            console.error('Fehler bei der Benutzersuche:', err.message);
            return res.status(500).json({ message: 'Fehler beim Login.' });
        }

        if (!user) {
            // Benutzer nicht gefunden
            return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
        }

        try {
            // Passwörter vergleichen
            const match = await bcrypt.compare(password, user.password_hash);

            if (match) {
                // Passwort stimmt überein -> Session erstellen
                req.session.userId = user.id; // Speichere Benutzer-ID in der Session
                req.session.username = user.username; // Optional: Speichere weitere Daten
                console.log(`Benutzer ${user.username} eingeloggt, Session ID: ${req.sessionID}`);
                res.status(200).json({ message: 'Login erfolgreich.', user: { id: user.id, username: user.username } });
            } else {
                // Passwort stimmt nicht überein
                res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
            }
        } catch (error) {
            console.error('Fehler beim Passwortvergleich:', error);
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    });
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

// Foto hochladen
app.post('/api/photos/upload', isAuthenticated, upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Keine Datei hochgeladen.' });
    }
    const userId = req.session.userId;
    const { filename, path: filepath, mimetype, size } = req.file;
    const sql = "INSERT INTO photos (filename, filepath, mimetype, size, user_id) VALUES (?, ?, ?, ?, ?)";
    db.run(sql, [filename, filepath, mimetype, size, userId], function(err) {
        if (err) {
            console.error("Fehler beim Speichern des Fotos:", err.message);
            return res.status(500).json({ message: "Fehler beim Speichern des Fotos." });
        }
        res.status(201).json({ 
            message: "Foto erfolgreich hochgeladen.",
            photo: { id: this.lastID, filename, upload_timestamp: new Date().toISOString() }
        });
    });
});

// Eigene Fotos abrufen
app.get('/api/photos/my', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const sql = "SELECT id, filename, upload_timestamp FROM photos WHERE user_id = ? ORDER BY upload_timestamp DESC";
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error("Fehler beim Abrufen der Fotos:", err.message);
            return res.status(500).json({ message: "Fehler beim Abrufen der Fotos." });
        }
        res.status(200).json(rows);
    });
});

// --- Ende Foto-Routen ---

// REMOVE THIS ROUTE - it's overriding the static file middleware
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// Server starten
app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});