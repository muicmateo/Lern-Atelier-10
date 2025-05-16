// ... existing code ...

// Benötigt: const db = require('./your-sqlite-database-connection'); // Ihre DB-Verbindung
// const router = express.Router(); // Falls noch nicht geschehen

// Route, um Fotos basierend auf dem Benutzernamen anzuzeigen
router.get('/fotos-von-benutzer', async (req, res) => {
    const usernameToFilter = req.query.username;

    if (!usernameToFilter) {
        return res.render('gallery', { // Sicherstellen, dass 'gallery' der Name Ihrer EJS-Datei ist
            photos: [], 
            message: 'Bitte einen Benutzernamen eingeben.',
            // filteredUsername: undefined // explizit setzen oder weglassen
        });
    }

    try {
        // Annahme: Ihre 'photos' Tabelle hat 'uploader_user_id'
        // und Ihre 'users' Tabelle hat 'id' und 'username'
        // ODER Sie speichern den 'username' direkt in der 'photos' Tabelle (z.B. als 'owner_username')
        // Passen Sie die Query entsprechend an!
        // Beispiel Query, wenn username direkt in photos.owner_username steht:
        // const query = `SELECT * FROM photos WHERE owner_username = ?`;
        // Beispiel Query mit JOIN (wie zuvor):
        const query = `
            SELECT p.* 
            FROM photos p
            JOIN users u ON p.uploader_user_id = u.id
            WHERE u.username = ?
        `;
        
        // Führen Sie die Abfrage mit Ihrer SQLite-Bibliothek aus
        // Beispiel mit 'better-sqlite3' (synchron):
        const stmt = db.prepare(query); // db muss Ihre better-sqlite3 Datenbankinstanz sein
        const photos = stmt.all(usernameToFilter);
        
        res.render('gallery', { // Sicherstellen, dass 'gallery' der Name Ihrer EJS-Datei ist
            photos: photos, 
            filteredUsername: usernameToFilter,
            message: photos.length === 0 ? `Keine Fotos für ${usernameToFilter} gefunden.` : null
        });

    } catch (error) {
        console.error("Fehler beim Verarbeiten der Anfrage:", error);
        // Im Fehlerfall ist es gut, dem Benutzer eine generische Fehlermeldung zu geben
        // und die Seite trotzdem zu rendern, wenn möglich, oder eine Fehlerseite.
        res.render('gallery', {
            photos: [],
            message: "Ein Fehler ist aufgetreten beim Laden der Fotos.",
            // filteredUsername: usernameToFilter // optional
        });
        // Alternativ: res.status(500).send("Ein interner Fehler ist aufgetreten.");
    }
});

// ... existing code ...