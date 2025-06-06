// --- Global Variables for DOM Elements and State ---
let authSection, appSection, loginForm, registerForm, loginMessage, registerMessage;
let userGreeting, logoutButton, uploadForm, photoInput, uploadMessage;
let myPhotosGallery, globalPhotosGallery, createAlbumForm, albumNameInput, albumMessage;
let albumsListDiv, albumSelectUpload, albumPhotoGalleryDiv, currentAlbumTitle;
let userListDisplay; // NEUE GLOBALE VARIABLE
let appContainer; // NEUE GLOBALE VARIABLE für den Hauptcontainer

let currentUserId = null; // To store the ID of the logged-in user

document.addEventListener('DOMContentLoaded', function() {
    // --- Initialize DOM Elements ---
    authSection = document.getElementById('auth-section');
    appSection = document.getElementById('app-section');
    appContainer = document.getElementById('app-container'); // Initialisiere appContainer
    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    loginMessage = document.getElementById('login-message');
    registerMessage = document.getElementById('register-message');
    userGreeting = document.getElementById('user-greeting');
    logoutButton = document.getElementById('logout-button');
    uploadForm = document.getElementById('upload-form');
    photoInput = document.getElementById('photo-input');
    uploadMessage = document.getElementById('upload-message');
    myPhotosGallery = document.getElementById('photo-gallery');
    globalPhotosGallery = document.getElementById('photo-gallery-all');
    createAlbumForm = document.getElementById('create-album-form');
    albumNameInput = document.getElementById('album-name-input');
    albumMessage = document.getElementById('album-message');
    albumsListDiv = document.getElementById('albums-list');
    albumSelectUpload = document.getElementById('album-select-upload');
    albumPhotoGalleryDiv = document.getElementById('album-photo-gallery');
    currentAlbumTitle = document.getElementById('current-album-title');
    userListDisplay = document.getElementById('user-list-display'); // Initialisiere userListDisplay

    // Set up event listeners
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister); // Now handleRegister will be found
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    if (uploadForm) uploadForm.addEventListener('submit', handleUpload);
    if (createAlbumForm) createAlbumForm.addEventListener('submit', handleCreateAlbum); // Now handleCreateAlbum will be found

    // --- Initial Check ---
    checkAuthStatus();
});

// --- Functions ---

// Function to display messages
function showMessage(element, message, isError = false) {
    if (element) {
        element.textContent = message;
        element.style.color = isError ? 'red' : 'green';
        element.style.display = 'block'; // Make sure message is visible
    }
}

// Function to check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
            const user = await response.json();
            currentUserId = user.id; 
            if (userGreeting) userGreeting.textContent = user.username; 
            if (authSection) authSection.style.display = 'none'; 
            // if (appSection) appSection.style.display = 'block'; // Alte Zeile
            if (appContainer) appContainer.style.display = 'flex'; // NEU: Zeige den Hauptcontainer an
            
            loadAlbums();
            loadMyPhotos(false); 
            loadAllPhotos();
            loadUserList(); // NEUER AUFRUF

        } else {
            clearAuthState();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        clearAuthState();
    }
}

function clearAuthState() {
    currentUserId = null; 
    if (authSection) authSection.style.display = 'block'; 
    // if (appSection) appSection.style.display = 'none'; // Alte Zeile
    if (appContainer) appContainer.style.display = 'none'; // NEU: Verstecke den Hauptcontainer
    clearGalleriesAndAlbumInfo();
    if (userListDisplay) userListDisplay.innerHTML = '<li>Bitte einloggen.</li>'; // NEU
}

function clearGalleriesAndAlbumInfo() {
    if (myPhotosGallery) myPhotosGallery.innerHTML = '<p>Bitte einloggen, um Fotos zu sehen.</p>'; // myPhotosGallery is now global
    if (globalPhotosGallery) globalPhotosGallery.innerHTML = '<p>Bitte einloggen, um Fotos zu sehen.</p>'; // globalPhotosGallery is now global
    if (albumsListDiv) albumsListDiv.innerHTML = '<p>Bitte einloggen, um Alben zu sehen.</p>'; // albumsListDiv is now global
    if (albumPhotoGalleryDiv) albumPhotoGalleryDiv.innerHTML = '<p>Bitte ein Album auswählen.</p>'; // albumPhotoGalleryDiv is now global
    if (currentAlbumTitle) currentAlbumTitle.textContent = 'Fotos im ausgewählten Album'; // currentAlbumTitle is now global
    if (albumSelectUpload) albumSelectUpload.innerHTML = '<option value="">-- Album auswählen --</option>'; // albumSelectUpload is now global
}

// Function to handle user login
async function handleLogin(event) {
    event.preventDefault();
    if (!loginMessage || !loginForm) {
        console.error("Login form or message element not found.");
        return;
    }
    showMessage(loginMessage, '', false); // Clear previous messages

    const usernameOrEmail = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (!usernameOrEmail || !password) {
        // Use the global loginMessage variable
        showMessage(loginMessage, 'Bitte geben Sie Benutzername/E-Mail und Passwort ein.', true);
        return;
    }

    // Show loading message
    // Use the global loginMessage variable
    showMessage(loginMessage, 'Anmeldung läuft...', false);

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernameOrEmail, password })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || `Login fehlgeschlagen: ${response.status}`);
        }
        // Successful login
        // Use the global loginMessage variable
        showMessage(loginMessage, 'Login erfolgreich!', false);
        if (loginForm) loginForm.reset(); // loginForm is now global
        checkAuthStatus(); // Refresh auth status and load app section
    } catch (error) {
        console.error('Login error:', error);
        // Use the global loginMessage variable
        showMessage(loginMessage, error.message || 'Ein Fehler ist aufgetreten bei der Anmeldung.', true);
    }
}

// Function to handle user registration
async function handleRegister(event) {
    event.preventDefault();
    if (!registerMessage || !registerForm) {
        console.error("Register form or message element not found");
        return;
    }
    showMessage(registerMessage, '', false); // Clear previous messages

    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    if (!username || !email || !password) {
        showMessage(registerMessage, 'Bitte füllen Sie alle Felder aus.', true);
        return;
    }
    showMessage(registerMessage, 'Registrierung wird verarbeitet...', false);

    try {
        const response = await fetch('/api/auth/register', { // Ensure this endpoint exists
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (!response.ok) {
            // If the server returns an error (like 500), response.ok will be false.
            // data.message would contain "Interner Serverfehler" if the server sent it.
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        showMessage(registerMessage, 'Registrierung erfolgreich! Sie können sich jetzt einloggen.', false);
        if (registerForm) registerForm.reset(); // registerForm is now global
        // Optionally, switch to login view or auto-login
    } catch (error) { // This is where the error is caught (around line 169)
        console.error('Registration error:', error); // This logs the error to the console
        showMessage(registerMessage, error.message || 'Ein Fehler ist bei der Registrierung aufgetreten.', true);
    }
}

// Function to handle user logout
function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST' })
    .then(response => {
        if (!response.ok) {
             // Try to parse error message from server if logout fails
            return response.json().then(err => { throw new Error(err.message || 'Logout fehlgeschlagen.'); });
        }
        return response.json(); // Or response.text() if no JSON body on successful logout
    })
    .then(data => {
        // console.log(data.message || 'Logout erfolgreich.'); // Optional: log success
        checkAuthStatus(); // This will update UI to logged-out state
    })
    .catch(error => {
        console.error('Logout error:', error);
        alert(error.message || 'Logout fehlgeschlagen. Bitte versuchen Sie es erneut.');
        clearAuthState(); // Ensure client state is cleared even if server call fails
    });
}

// Function to handle photo upload
function handleUpload(event) {
    event.preventDefault();
    if (!uploadMessage || !photoInput || !uploadForm) {
         console.error("Upload form elements not found");
         return;
    }
    showMessage(uploadMessage, '', false); // Clear previous messages

    const photoFile = photoInput.files[0]; // photoInput is now global
    const selectedAlbumId = albumSelectUpload ? albumSelectUpload.value : null; // albumSelectUpload is now global

    if (!photoFile) {
        showMessage(uploadMessage, 'Bitte wählen Sie eine Datei aus.', true);
        return;
    }
    
    // Require an album to be selected for upload
    if (!selectedAlbumId) {
        showMessage(uploadMessage, 'Bitte wählen Sie ein Album für das Foto aus.', true);
        return;
    }

    showMessage(uploadMessage, 'Lade Foto hoch...', false);
    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('album_id', selectedAlbumId); // Ensure album_id is appended

    fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
        // Headers for FormData are set automatically by the browser, including Content-Type: multipart/form-data
    })
    .then(async response => { // Make this async to await response.json() in case of error
        const data = await response.json(); // Try to parse JSON regardless of response.ok
        return { response, data }; // Pass both to the next .then()
    })
    .then(({response, data}) => { // Destructure to get response and data
        if (!response.ok) {
            // data.message should now contain "Album-ID ist erforderlich." or other server messages
            throw new Error(data.message || 'Upload fehlgeschlagen.');
        }
        showMessage(uploadMessage, 'Foto erfolgreich hochgeladen!', false);
        if (uploadForm) uploadForm.reset(); // uploadForm is now global
        
        // Refresh relevant photo lists
        if (typeof loadMyPhotos === 'function') loadMyPhotos(false);
        if (typeof loadAllPhotos === 'function') loadAllPhotos();
        // If uploading to a specific album, you might want to refresh that album's view too
        if (selectedAlbumId && typeof loadPhotosForAlbum === 'function') loadPhotosForAlbum(selectedAlbumId);

    })
    .catch(error => {
        console.error('Upload error:', error);
        showMessage(uploadMessage, `Fehler: ${error.message}`, true);
    });
}

// --- Album Functions ---
async function handleCreateAlbum(event) {
    event.preventDefault();
    if (!albumMessage || !albumNameInput || !createAlbumForm) {
        console.error("Album creation form elements not found");
        return;
    }
    showMessage(albumMessage, '', false); // Clear previous messages

    const albumName = albumNameInput.value.trim(); // albumNameInput is now global
    if (!albumName) {
        showMessage(albumMessage, 'Albumname ist erforderlich.', true);
        return;
    }
    showMessage(albumMessage, 'Erstelle Album...', false);

    try {
        const response = await fetch('/api/albums', { // Ensure this endpoint exists
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: albumName }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `Fehler beim Erstellen des Albums: ${response.statusText}`);
        }

        showMessage(albumMessage, 'Album erfolgreich erstellt!', false);
        if (createAlbumForm) createAlbumForm.reset(); // createAlbumForm is now global
        loadAlbums(); // Reload albums list
    } catch (error) {
        console.error('Fehler beim Erstellen des Albums:', error);
        showMessage(albumMessage, error.message || 'Ein Fehler ist aufgetreten.', true);
    }
}

// --- Stub Functions - Implement these ---

// Funktion zum Anzeigen der Fotos in einer Galerie
function renderPhotoGallery(photos, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!photos || photos.length === 0) {
        container.innerHTML = '<p>Keine Fotos vorhanden.</p>';
        return;
    }
    
    photos.forEach(photo => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        
        // Erstelle das Bild-Element
        const img = document.createElement('img');
        img.src = `/uploads/${photo.filename}`;
        img.alt = 'Foto';
        img.addEventListener('click', () => openPhotoModal(photo.filename));
        
        // Erstelle die Info-Box
        const infoDiv = document.createElement('div');
        infoDiv.className = 'photo-info';
        infoDiv.innerHTML = `
            <p>Hochgeladen: ${new Date(photo.created_at || Date.now()).toLocaleDateString()}</p>
        `;
        
        // Erstelle die Aktions-Buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'photo-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Löschen';
        deleteBtn.addEventListener('click', () => deletePhoto(photo.id));
        
        const shareBtn = document.createElement('button');
        shareBtn.className = 'share-btn';
        shareBtn.innerHTML = '<i class="fas fa-share"></i> Teilen';
        shareBtn.addEventListener('click', () => showShareDialog(photo.id));
        
        actionsDiv.appendChild(deleteBtn);
        actionsDiv.appendChild(shareBtn);
        
        // Füge alles zum Foto-Card hinzu
        photoCard.appendChild(img);
        photoCard.appendChild(infoDiv);
        photoCard.appendChild(actionsDiv);
        
        container.appendChild(photoCard);
    });
}

// Funktion zum Öffnen der Vollbildansicht
function openPhotoModal(filename) {
    const modal = document.createElement('div');
    modal.className = 'photo-modal';
    modal.style.display = 'flex';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const img = document.createElement('img');
    img.src = `/uploads/${filename}`;
    img.alt = 'Foto Vollbild';
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-modal';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modalContent.appendChild(img);
    modal.appendChild(modalContent);
    modal.appendChild(closeBtn);
    
    // Schließen beim Klick außerhalb des Bildes
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    document.body.appendChild(modal);
}

// Funktion zum Löschen eines Fotos
function deletePhoto(photoId) {
    if (!confirm('Möchtest du dieses Foto wirklich löschen?')) {
        return;
    }
    
    fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fehler beim Löschen des Fotos');
        }
        return response.json();
    })
    .then(data => {
        showMessage(data.message, 'success');
        // Aktualisiere die Fotogalerie
        loadMyPhotos();
        loadAllPhotos();
    })
    .catch(error => {
        console.error('Fehler:', error);
        showMessage('Fehler beim Löschen des Fotos', 'error');
    });
}

// Funktion zum Anzeigen des Teilen-Dialogs
function showShareDialog(photoId) {
    // Erstelle einen einfachen Dialog zum Teilen
    const username = prompt('Mit welchem Benutzer möchtest du dieses Foto teilen?');
    
    if (!username) return;
    
    fetch(`/api/photos/${photoId}/share`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUsername: username }),
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fehler beim Teilen des Fotos');
        }
        return response.json();
    })
    .then(data => {
        showMessage(data.message, 'success');
    })
    .catch(error => {
        console.error('Fehler:', error);
        showMessage('Fehler beim Teilen des Fotos', 'error');
    });
}

// Funktion zum Anzeigen von Benachrichtigungen
function showMessage(message, type = 'info') {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message ${type}`;
    messageContainer.textContent = message;
    
    document.body.appendChild(messageContainer);
    
    // Nachricht nach 3 Sekunden ausblenden
    setTimeout(() => {
        messageContainer.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(messageContainer);
        }, 500);
    }, 3000);
}

// Lade meine Fotos beim Seitenaufruf
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ... 
    
    // Lade Fotos, wenn die entsprechenden Container existieren
    if (document.getElementById('my-photos')) {
        loadMyPhotos();
    }
    
    if (document.getElementById('all-photos')) {
        loadAllPhotos();
    }
});

// Funktion zum Laden meiner Fotos
function loadMyPhotos() {
    fetch('/api/photos/my', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Fotos');
        }
        return response.json();
    })
    .then(photos => {
        renderPhotoGallery(photos, 'my-photos');
    })
    .catch(error => {
        console.error('Fehler:', error);
        showMessage('Fehler beim Laden deiner Fotos', 'error');
    });
}

// Funktion zum Laden aller Fotos
function loadAllPhotos() {
    fetch('/api/photos', { // Changed from /api/photos/all to /api/photos
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Fotos');
        }
        return response.json();
    })
    .then(photos => {
        renderPhotoGallery(photos, 'photo-gallery-all');
        renderPhotoGallery(photos, 'all-photos');
    })
    .catch(error => {
        console.error('Fehler:', error);
        showMessage('Fehler beim Laden aller Fotos', 'error');
    });
}

// Funktion zum Anzeigen der Fotos in einer Galerie
function renderPhotoGallery(photos, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!photos || photos.length === 0) {
        container.innerHTML = '<p>Keine Fotos vorhanden.</p>';
        return;
    }
    
    photos.forEach(photo => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        
        // Erstelle das Bild-Element
        const img = document.createElement('img');
        img.src = `/uploads/${photo.filename}`;
        img.alt = 'Foto';
        img.addEventListener('click', () => openPhotoModal(photo.filename));
        
        // Erstelle die Info-Box
        const infoDiv = document.createElement('div');
        infoDiv.className = 'photo-info';
        infoDiv.innerHTML = `
            <p>Hochgeladen: ${new Date(photo.created_at || Date.now()).toLocaleDateString()}</p>
        `;
        
        // Erstelle die Aktions-Buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'photo-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Löschen';
        deleteBtn.addEventListener('click', () => deletePhoto(photo.id));
        
        const shareBtn = document.createElement('button');
        shareBtn.className = 'share-btn';
        shareBtn.innerHTML = '<i class="fas fa-share"></i> Teilen';
        shareBtn.addEventListener('click', () => showShareDialog(photo.id));
        
        actionsDiv.appendChild(deleteBtn);
        actionsDiv.appendChild(shareBtn);
        
        // Füge alles zum Foto-Card hinzu
        photoCard.appendChild(img);
        photoCard.appendChild(infoDiv);
        photoCard.appendChild(actionsDiv);
        
        container.appendChild(photoCard);
    });
}

// Login-Formular-Handler
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const usernameOrEmail = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const messageElement = document.getElementById('login-message');
    
    // Zurücksetzen der Nachricht
    messageElement.textContent = '';
    messageElement.className = 'message';
    
    // Daten an den Server senden
    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usernameOrEmail, password }),
        credentials: 'same-origin' // Wichtig für Cookies/Sessions
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || 'Fehler beim Login');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Login erfolgreich:', data);
        messageElement.textContent = data.message || 'Login erfolgreich!';
        messageElement.className = 'message success';
        
        // Benutzerinfo speichern und UI aktualisieren
        localStorage.setItem('user', JSON.stringify(data.user));
        document.getElementById('user-greeting').textContent = data.user.username;
        
        // UI-Zustand aktualisieren
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('app-section').style.display = 'block';
        
        // Lade Benutzerinhalte
        loadUserContent();
    })
    .catch(error => {
        console.error('Login fehlgeschlagen:', error);
        messageElement.textContent = error.message || 'Login fehlgeschlagen. Bitte versuche es erneut.';
        messageElement.className = 'message error';
    });
});

// Funktion zum Laden der Benutzerinhalte nach dem Login
function loadUserContent() {
    try {
        // Lade Alben des Benutzers
        loadAlbums();
        
        // Lade Fotos des Benutzers
        loadMyPhotos();
        
        // Lade alle Fotos
        loadAllPhotos();
    } catch (error) {
        console.error('Fehler beim Laden der Benutzerinhalte:', error);
    }
}

// Funktion zum Laden der Alben
function loadAlbums() {
    fetch('/api/albums', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Alben');
        }
        return response.json();
    })
    .then(albums => {
        const albumsList = document.getElementById('albums-list');
        const albumSelect = document.getElementById('album-select-upload');
        
        // Zurücksetzen der Listen
        albumsList.innerHTML = '';
        
        // Behalte die "Kein Album"-Option und lösche den Rest
        const defaultOption = albumSelect.options[0];
        albumSelect.innerHTML = '';
        albumSelect.appendChild(defaultOption);
        
        if (albums.length === 0) {
            albumsList.innerHTML = '<p>Keine Alben vorhanden.</p>';
            return;
        }
        
        // Alben zur Liste hinzufügen
        albums.forEach(album => {
            // Für die Albumliste
            const albumItem = document.createElement('div');
            albumItem.className = 'album-item';
            albumItem.innerHTML = `
                <h3>${album.name}</h3>
                <button class="view-album-btn" data-album-id="${album.id}">Anzeigen</button>
            `;
            albumsList.appendChild(albumItem);
            
            // Für das Dropdown-Menü beim Upload
            const option = document.createElement('option');
            option.value = album.id;
            option.textContent = album.name;
            albumSelect.appendChild(option);
        });
        
        // Event-Listener für "Anzeigen"-Buttons
        document.querySelectorAll('.view-album-btn').forEach(button => {
            button.addEventListener('click', function() {
                const albumId = this.getAttribute('data-album-id');
                loadAlbumPhotos(albumId);
            });
        });
    })
    .catch(error => {
        console.error('Fehler beim Laden der Alben:', error);
        document.getElementById('albums-list').innerHTML = 
            `<p class="error">Fehler beim Laden der Alben: ${error.message}</p>`;
    });
}

// Funktion zum Laden der Fotos eines Albums
function loadAlbumPhotos(albumId) {
    fetch(`/api/albums/${albumId}/photos`, {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Album-Fotos');
        }
        return response.json();
    })
    .then(photos => {
        const albumTitle = document.getElementById('current-album-title');
        const photoGallery = document.getElementById('album-photo-gallery');
        
        // Titel aktualisieren
        albumTitle.textContent = `Fotos im ausgewählten Album (${photos.length})`;
        
        // Galerie zurücksetzen
        photoGallery.innerHTML = '';
        
        if (photos.length === 0) {
            photoGallery.innerHTML = '<p>Keine Fotos in diesem Album.</p>';
            return;
        }
        
        // Fotos zur Galerie hinzufügen
        renderPhotoGallery(photos, 'album-photo-gallery');
    })
    .catch(error => {
        console.error('Fehler beim Laden der Album-Fotos:', error);
        document.getElementById('album-photo-gallery').innerHTML = 
            `<p class="error">Fehler beim Laden der Fotos: ${error.message}</p>`;
    });
}

// Funktion zum Laden meiner Fotos
function loadMyPhotos() {
    fetch('/api/photos/my', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Fotos');
        }
        return response.json();
    })
    .then(photos => {
        renderPhotoGallery(photos, 'photo-gallery');
        renderPhotoGallery(photos, 'my-photos');
    })
    .catch(error => {
        console.error('Fehler beim Laden meiner Fotos:', error);
        document.getElementById('photo-gallery').innerHTML = 
            `<p class="error">Fehler beim Laden der Fotos: ${error.message}</p>`;
        document.getElementById('my-photos').innerHTML = 
            `<p class="error">Fehler beim Laden der Fotos: ${error.message}</p>`;
    });
}

// Funktion zum Laden aller Fotos
function loadAllPhotos() {
    fetch('/api/photos', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Fotos');
        }
        return response.json();
    })
    .then(photos => {
        renderPhotoGallery(photos, 'photo-gallery-all');
        renderPhotoGallery(photos, 'all-photos');
    })
    .catch(error => {
        console.error('Fehler beim Laden aller Fotos:', error);
        document.getElementById('photo-gallery-all').innerHTML = 
            `<p class="error">Fehler beim Laden der Fotos: ${error.message}</p>`;
        document.getElementById('all-photos').innerHTML = 
            `<p class="error">Fehler beim Laden der Fotos: ${error.message}</p>`;
    });
}

// Funktion zum Anzeigen der Fotos in einer Galerie
function renderPhotoGallery(photos, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!photos || photos.length === 0) {
        container.innerHTML = '<p>Keine Fotos vorhanden.</p>';
        return;
    }
    
    photos.forEach(photo => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        
        // Erstelle das Bild-Element
        const img = document.createElement('img');
        img.src = `/uploads/${photo.filename}`;
        img.alt = 'Foto';
        img.addEventListener('click', () => openPhotoModal(photo.filename));
        
        // Erstelle die Info-Box
        const infoDiv = document.createElement('div');
        infoDiv.className = 'photo-info';
        infoDiv.innerHTML = `
            <p>Hochgeladen: ${new Date(photo.created_at || Date.now()).toLocaleDateString()}</p>
        `;
        
        // Erstelle die Aktions-Buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'photo-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Löschen';
        deleteBtn.addEventListener('click', () => deletePhoto(photo.id));
        
        const shareBtn = document.createElement('button');
        shareBtn.className = 'share-btn';
        shareBtn.innerHTML = '<i class="fas fa-share"></i> Teilen';
        shareBtn.addEventListener('click', () => showShareDialog(photo.id));
        
        actionsDiv.appendChild(deleteBtn);
        actionsDiv.appendChild(shareBtn);
        
        // Füge alles zum Foto-Card hinzu
        photoCard.appendChild(img);
        photoCard.appendChild(infoDiv);
        photoCard.appendChild(actionsDiv);
        
        container.appendChild(photoCard);
    });
}

// NEUE FUNKTIONEN ZUM LADEN UND ANZEIGEN DER BENUTZERLISTE
async function loadUserList() {
    if (!userListDisplay) return;
    userListDisplay.innerHTML = '<li>Lade Benutzer...</li>'; // Ladezustand anzeigen

    try {
        const response = await fetch('/api/users/list');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Fehler beim Laden der Benutzerliste');
        }
        const users = await response.json();
        renderUserList(users);
    } catch (error) {
        console.error('Fehler beim Laden der Benutzerliste:', error);
        if (userListDisplay) userListDisplay.innerHTML = `<li>Fehler: ${error.message}</li>`;
    }
}

function renderUserList(users) {
    if (!userListDisplay) return;
    userListDisplay.innerHTML = ''; // Bestehende Liste leeren

    if (users && users.length > 0) {
        users.forEach(user => {
            const listItem = document.createElement('li');
            listItem.textContent = user.username;
            // Optional: Klick-Event hinzufügen, um Benutzerprofile anzuzeigen (zukünftige Erweiterung)
            // listItem.addEventListener('click', () => viewUserProfile(user.id));
            userListDisplay.appendChild(listItem);
        });
    } else {
        userListDisplay.innerHTML = '<li>Keine Benutzer gefunden.</li>';
    }
}

// Function to handle photo upload
function handleUpload(event) {
    event.preventDefault();
    if (!uploadMessage || !photoInput || !uploadForm) {
         console.error("Upload form elements not found");
         return;
    }
    showMessage(uploadMessage, '', false); // Clear previous messages

    const photoFile = photoInput.files[0]; // photoInput is now global
    const selectedAlbumId = albumSelectUpload ? albumSelectUpload.value : null; // albumSelectUpload is now global

    if (!photoFile) {
        showMessage(uploadMessage, 'Bitte wählen Sie eine Datei aus.', true);
        return;
    }
    
    // Require an album to be selected for upload
    if (!selectedAlbumId) {
        showMessage(uploadMessage, 'Bitte wählen Sie ein Album für das Foto aus.', true);
        return;
    }

    showMessage(uploadMessage, 'Lade Foto hoch...', false);
    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('album_id', selectedAlbumId); // Ensure album_id is appended

    fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
        // Headers for FormData are set automatically by the browser, including Content-Type: multipart/form-data
    })
    .then(async response => { // Make this async to await response.json() in case of error
        const data = await response.json(); // Try to parse JSON regardless of response.ok
        return { response, data }; // Pass both to the next .then()
    })
    .then(({response, data}) => { // Destructure to get response and data
        if (!response.ok) {
            // data.message should now contain "Album-ID ist erforderlich." or other server messages
            throw new Error(data.message || 'Upload fehlgeschlagen.');
        }
        showMessage(uploadMessage, 'Foto erfolgreich hochgeladen!', false);
        if (uploadForm) uploadForm.reset(); // uploadForm is now global
        
        // Refresh relevant photo lists
        if (typeof loadMyPhotos === 'function') loadMyPhotos(false);
        if (typeof loadAllPhotos === 'function') loadAllPhotos();
        // If uploading to a specific album, you might want to refresh that album's view too
        if (selectedAlbumId && typeof loadPhotosForAlbum === 'function') loadPhotosForAlbum(selectedAlbumId);

    })
    .catch(error => {
        console.error('Upload error:', error);
        showMessage(uploadMessage, `Fehler: ${error.message}`, true);
    });
}

// --- Album Functions ---
async function handleCreateAlbum(event) {
    event.preventDefault();
    if (!albumMessage || !albumNameInput || !createAlbumForm) {
        console.error("Album creation form elements not found");
        return;
    }
    showMessage(albumMessage, '', false); // Clear previous messages

    const albumName = albumNameInput.value.trim(); // albumNameInput is now global
    if (!albumName) {
        showMessage(albumMessage, 'Albumname ist erforderlich.', true);
        return;
    }
    showMessage(albumMessage, 'Erstelle Album...', false);

    try {
        const response = await fetch('/api/albums', { // Ensure this endpoint exists
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: albumName }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `Fehler beim Erstellen des Albums: ${response.statusText}`);
        }

        showMessage(albumMessage, 'Album erfolgreich erstellt!', false);
        if (createAlbumForm) createAlbumForm.reset(); // createAlbumForm is now global
        loadAlbums(); // Reload albums list
    } catch (error) {
        console.error('Fehler beim Erstellen des Albums:', error);
        showMessage(albumMessage, error.message || 'Ein Fehler ist aufgetreten.', true);
    }
}

// --- Stub Functions - Implement these ---

// Funktion zum Anzeigen der Fotos in einer Galerie
function renderPhotoGallery(photos, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!photos || photos.length === 0) {
        container.innerHTML = '<p>Keine Fotos vorhanden.</p>';
        return;
    }
    
    photos.forEach(photo => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        
        // Erstelle das Bild-Element
        const img = document.createElement('img');
        img.src = `/uploads/${photo.filename}`;
        img.alt = 'Foto';
        img.addEventListener('click', () => openPhotoModal(photo.filename));
        
        // Erstelle die Info-Box
        const infoDiv = document.createElement('div');
        infoDiv.className = 'photo-info';
        infoDiv.innerHTML = `
            <p>Hochgeladen: ${new Date(photo.created_at || Date.now()).toLocaleDateString()}</p>
        `;
        
        // Erstelle die Aktions-Buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'photo-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Löschen';
        deleteBtn.addEventListener('click', () => deletePhoto(photo.id));
        
        const shareBtn = document.createElement('button');
        shareBtn.className = 'share-btn';
        shareBtn.innerHTML = '<i class="fas fa-share"></i> Teilen';
        shareBtn.addEventListener('click', () => showShareDialog(photo.id));
        
        actionsDiv.appendChild(deleteBtn);
        actionsDiv.appendChild(shareBtn);
        
        // Füge alles zum Foto-Card hinzu
        photoCard.appendChild(img);
        photoCard.appendChild(infoDiv);
        photoCard.appendChild(actionsDiv);
        
        container.appendChild(photoCard);
    });
}

// Funktion zum Öffnen der Vollbildansicht
function openPhotoModal(filename) {
    const modal = document.createElement('div');
    modal.className = 'photo-modal';
    modal.style.display = 'flex';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const img = document.createElement('img');
    img.src = `/uploads/${filename}`;
    img.alt = 'Foto Vollbild';
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-modal';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modalContent.appendChild(img);
    modal.appendChild(modalContent);
    modal.appendChild(closeBtn);
    
    // Schließen beim Klick außerhalb des Bildes
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    document.body.appendChild(modal);
}

// Funktion zum Löschen eines Fotos
function deletePhoto(photoId) {
    if (!confirm('Möchtest du dieses Foto wirklich löschen?')) {
        return;
    }
    
    fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fehler beim Löschen des Fotos');
        }
        return response.json();
    })
    .then(data => {
        showMessage(data.message, 'success');
        // Aktualisiere die Fotogalerie
        loadMyPhotos();
        loadAllPhotos();
    })
    .catch(error => {
        console.error('Fehler:', error);
        showMessage('Fehler beim Löschen des Fotos', 'error');
    });
}

// Funktion zum Anzeigen des Teilen-Dialogs
function showShareDialog(photoId) {
    // Erstelle einen einfachen Dialog zum Teilen
    const username = prompt('Mit welchem Benutzer möchtest du dieses Foto teilen?');
    
    if (!username) return;
    
    fetch(`/api/photos/${photoId}/share`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUsername: username }),
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fehler beim Teilen des Fotos');
        }
        return response.json();
    })
    .then(data => {
        showMessage(data.message, 'success');
    })
    .catch(error => {
        console.error('Fehler:', error);
        showMessage('Fehler beim Teilen des Fotos', 'error');
    });
}

// Funktion zum Anzeigen von Benachrichtigungen
function showMessage(message, type = 'info') {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message ${type}`;
    messageContainer.textContent = message;
    
    document.body.appendChild(messageContainer);
    
    // Nachricht nach 3 Sekunden ausblenden
    setTimeout(() => {
        messageContainer.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(messageContainer);
        }, 500);
    }, 3000);
}

// Lade meine Fotos beim Seitenaufruf
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ... 
    
    // Lade Fotos, wenn die entsprechenden Container existieren
    if (document.getElementById('my-photos')) {
        loadMyPhotos();
    }
    
    if (document.getElementById('all-photos')) {
        loadAllPhotos();
    }
});

// Funktion zum Laden meiner Fotos
function loadMyPhotos() {
    fetch('/api/photos/my', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Fotos');
        }
        return response.json();
    })
    .then(photos => {
        renderPhotoGallery(photos, 'my-photos');
    })
    .catch(error => {
        console.error('Fehler:', error);
        showMessage('Fehler beim Laden deiner Fotos', 'error');
    });
}

// Funktion zum Laden aller Fotos
function loadAllPhotos() {
    fetch('/api/photos', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Fotos');
        }
        return response.json();
    })
    .then(photos => {
        renderPhotoGallery(photos, 'photo-gallery-all');
        renderPhotoGallery(photos, 'all-photos');
    })
    .catch(error => {
        console.error('Fehler:', error);
        showMessage('Fehler beim Laden aller Fotos', 'error');
    });
}

// Funktion zum Anzeigen der Fotos in einer Galerie
function renderPhotoGallery(photos, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!photos || photos.length === 0) {
        container.innerHTML = '<p>Keine Fotos vorhanden.</p>';
        return;
    }
    
    photos.forEach(photo => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        
        // Erstelle das Bild-Element
        const img = document.createElement('img');
        img.src = `/uploads/${photo.filename}`;
        img.alt = 'Foto';
        img.addEventListener('click', () => openPhotoModal(photo.filename));
        
        // Erstelle die Info-Box
        const infoDiv = document.createElement('div');
        infoDiv.className = 'photo-info';
        infoDiv.innerHTML = `
            <p>Hochgeladen: ${new Date(photo.created_at || Date.now()).toLocaleDateString()}</p>
        `;
        
        // Erstelle die Aktions-Buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'photo-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Löschen';
        deleteBtn.addEventListener('click', () => deletePhoto(photo.id));
        
        const shareBtn = document.createElement('button');
        shareBtn.className = 'share-btn';
        shareBtn.innerHTML = '<i class="fas fa-share"></i> Teilen';
        shareBtn.addEventListener('click', () => showShareDialog(photo.id));
        
        actionsDiv.appendChild(deleteBtn);
        actionsDiv.appendChild(shareBtn);
        
        // Füge alles zum Foto-Card hinzu
        photoCard.appendChild(img);
        photoCard.appendChild(infoDiv);
        photoCard.appendChild(actionsDiv);
        
        container.appendChild(photoCard);
    });
}