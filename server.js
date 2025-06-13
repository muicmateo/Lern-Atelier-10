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
    // IMPORTANT: Replace this placeholder with a strong, unique, random secret key!
    // Generate a good one using a password manager or a random string generator.
    // For example: require('crypto').randomBytes(64).toString('hex')
    secret: process.env.SESSION_SECRET || 'YOUR_VERY_STRONG_RANDOM_SECRET_KEY_HERE_MIN_32_CHARS', // WICHTIG: Ändere dies in einen starken, geheimen Schlüssel!
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
        // The logged error "Fehler beim Passwort-Hashing: TypeError: db.run is not a function"
        // indicates that 'error' IS the TypeError from db.run.
        // The console message here should be more general or specific to DB issues.
        console.error('Fehler im Registrierungsprozess:', error); // More accurate error message
        res.status(500).json({ message: 'Interner Serverfehler bei der Verarbeitung der Registrierung.' });
    }
});

// Login (POST /api/auth/login', (req, res) => {
app.post('/api/auth/login', (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
        return res.status(400).json({ message: 'Benutzername/E-Mail und Passwort sind erforderlich.' });
    }

    try {
        // Add this log to inspect 'db'
        console.log('Inspecting db in /api/auth/login:', typeof db, db);

        // Explicitly check if db and db.get are valid
        if (!db || typeof db.get !== 'function') {
            console.error('Datenbankobjekt (db) ist nicht korrekt initialisiert oder db.get ist keine Funktion. Überprüfen Sie database.js.');
            return res.status(500).json({ message: 'Interner Serverfehler: Datenbankverbindungsproblem.' });
        }

        const sql = `SELECT * FROM users WHERE username = ? OR email = ?`;
        db.get(sql, [usernameOrEmail, usernameOrEmail], async (err, user) => {
            if (err) {
                console.error('Datenbankfehler beim Login:', err.message);
                return res.status(500).json({ message: 'Ein interner Serverfehler ist aufgetreten.' });
            }
            if (!user) {
                return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
            }

            const match = await bcrypt.compare(password, user.password_hash);
            if (match) {
                req.session.userId = user.id;
                req.session.username = user.username;
                return res.json({ message: 'Login erfolgreich.', user: { id: user.id, username: user.username } });
            } else {
                return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
            }
        });
    } catch (error) {
        console.error('Fehler beim Login:', error.message);
        return res.status(500).json({ message: 'Ein Fehler ist aufgetreten.' });
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

app.get('/api/users', isAuthenticated, (req, res) => {
    // Diese Route ist durch `isAuthenticated` geschützt, genau wie Ihre anderen Routen.

    // SQL-Abfrage, um nur die benötigten und öffentlichen Informationen abzurufen.
    // Geben Sie NIEMALS Passwort-Hashes an den Client weiter!
    const sql = "SELECT id, username, created_at FROM users ORDER BY username";

    db.all(sql, [], (err, users) => {
        if (err) {
            console.error("Datenbankfehler beim Abrufen der Benutzerliste:", err.message);
            return res.status(500).json({ message: "Fehler beim Laden der Benutzerliste." });
        }
        
        // Senden Sie die Liste der Benutzer als JSON-Antwort
        res.status(200).json(users);
    });
});

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
app.post('/api/photos/upload', isAuthenticated, upload.single('photo'), (req, res) => {
    const userId = req.session.userId;
    
    if (!req.file) {
        return res.status(400).json({ message: 'Keine Fotodatei empfangen.' });
    }
    const filename = req.file.filename;
    const filepath = req.file.path; // Get the full path of the uploaded file
    const albumId = req.body.album_id; // album_id from FormData

    if (!albumId) {
        // This is likely where your "Album-ID ist erforderlich." error originates
        return res.status(400).json({ message: 'Album-ID ist erforderlich.' });
    }

    // Ensure your database schema (photoshare.db) actually has a filepath column.
    // If it does, and it's NOT NULL, this INSERT will work.
    // If database.js is the source of truth and it doesn't have filepath,
    // then the database schema needs to be aligned with database.js.
    const sql = 'INSERT INTO photos (filename, user_id, album_id, filepath) VALUES (?, ?, ?, ?)';
    db.run(sql, [filename, userId, albumId, filepath], function(err) {
        if (err) {
            console.error('Datenbankfehler beim Speichern des Fotos:', err.message);
            return res.status(500).json({ message: 'Fehler beim Speichern des Fotos.' });
        }
        res.status(201).json({ message: 'Foto erfolgreich hochgeladen.', photoId: this.lastID, filename: filename });
    });
});

// GET all photos for the logged-in user
app.get('/api/photos/mine', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const sql = "SELECT id, filename, user_id, album_id, created_at FROM photos WHERE user_id = ? ORDER BY created_at DESC";
    
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error('Datenbankfehler beim Abrufen meiner Fotos:', err.message); // This error
            return res.status(500).json({ message: 'Fehler beim Abrufen der Fotos des Benutzers.' });
        }
        res.json(rows);
    });
});


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


// GET all photos (adjust for privacy/pagination as needed)
// Add this route to handle /api/photos requests
app.get('/api/photos', isAuthenticated, (req, res) => { 
// Reuse the same SQL query from the /api/photos/all route
const sql = `
SELECT 
p.id, 
p.filename, 
p.user_id, 
u.username AS owner_username, 
p.album_id, 
a.name AS album_name, 
p.created_at 
FROM photos p
JOIN users u ON p.user_id = u.id
JOIN albums a ON p.album_id = a.id
ORDER BY p.created_at DESC
`;

db.all(sql, [], (err, rows) => {
if (err) {
console.error('Datenbankfehler beim Abrufen aller Fotos:', err.message);
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
                        // Loggen Sie den Fehler, aber senden Sie trotzdem eine Erfolgsmeldung
                        console.error("Fehler beim Löschen der Datei:", unlinkErr);
                    }
                    res.json({ message: "Foto erfolgreich gelöscht." });
                });
            } else {
                res.json({ message: "Foto erfolgreich gelöscht." });
            }
        });
    }); 
}); 

            
// Server starten
app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});


// Route, um Fotos basierend auf dem Benutzernamen anzuzeigen
app.get('/fotos-von-benutzer', async (req, res) => {
    const usernameToFilter = req.query.username;

    if (!usernameToFilter) {
        return res.render('gallery', {
            photos: [], 
            message: 'Bitte einen Benutzernamen eingeben.'
        });
    }

    try {
        // Abfrage mit Beziehungstabelle (photo_permissions)
        const query = `
            SELECT p.* 
            FROM photos p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN photo_permissions pp ON p.id = pp.photo_id
            LEFT JOIN users viewer ON pp.user_id = viewer.id
            WHERE u.username = ? OR viewer.username = ?
        `;
        
        db.all(query, [usernameToFilter, usernameToFilter], (err, photos) => {
            if (err) {
                console.error("Fehler beim Abrufen der Fotos:", err.message);
                return res.render('gallery', {
                    photos: [],
                    message: "Ein Fehler ist aufgetreten beim Laden der Fotos."
                });
            }
            
            res.render('gallery', {
                photos: photos, 
                filteredUsername: usernameToFilter,
                message: photos.length === 0 ? `Keine Fotos für ${usernameToFilter} gefunden.` : null
            });
        });

    } catch (error) {
        console.error("Fehler beim Verarbeiten der Anfrage:", error);
        res.render('gallery', {
            photos: [],
            message: "Ein Fehler ist aufgetreten beim Laden der Fotos."
        });
    }
});

// EJS als Template-Engine einrichten
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Foto mit einem anderen Benutzer teilen
app.post('/api/photos/:photoId/share', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const photoId = req.params.photoId;
    const { targetUsername, permissionType = 'view' } = req.body;
    
    if (!targetUsername) {
        return res.status(400).json({ message: 'Benutzername ist erforderlich.' });
    }
    
    // 1. Überprüfen, ob das Foto dem aktuellen Benutzer gehört
    db.get('SELECT id FROM photos WHERE id = ? AND user_id = ?', [photoId, userId], (err, photo) => {
        if (err) {
            console.error('Fehler beim Überprüfen des Fotos:', err.message);
            return res.status(500).json({ message: 'Fehler beim Teilen des Fotos.' });
        }
        
        if (!photo) {
            return res.status(403).json({ message: 'Nicht autorisiert, dieses Foto zu teilen.' });
        }
        
        // 2. Ziel-Benutzer finden
        db.get('SELECT id FROM users WHERE username = ?', [targetUsername], (err, targetUser) => {
            if (err) {
                console.error('Fehler beim Suchen des Ziel-Benutzers:', err.message);
                return res.status(500).json({ message: 'Fehler beim Teilen des Fotos.' });
            }
            
            if (!targetUser) {
                return res.status(404).json({ message: 'Ziel-Benutzer nicht gefunden.' });
            }
            
            // 3. Berechtigung hinzufügen
            const sql = 'INSERT OR REPLACE INTO photo_permissions (photo_id, user_id, permission_type) VALUES (?, ?, ?)';
            db.run(sql, [photoId, targetUser.id, permissionType], function(err) {
                if (err) {
                    console.error('Fehler beim Hinzufügen der Berechtigung:', err.message);
                    return res.status(500).json({ message: 'Fehler beim Teilen des Fotos.' });
                }
                
                res.status(200).json({ message: `Foto erfolgreich mit ${targetUsername} geteilt.` });
            });
        });
    });
});
