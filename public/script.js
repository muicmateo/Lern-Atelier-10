// --- Global Variables for DOM Elements and State ---
let authSection, appSection, loginForm, registerForm, loginMessage, registerMessage;
let userGreeting, logoutButton, uploadForm, photoInput, uploadMessage;
let myPhotosGallery, globalPhotosGallery, createAlbumForm, albumNameInput, albumMessage;
let albumsListDiv, albumSelectUpload, albumPhotoGalleryDiv, currentAlbumTitle;

let currentUserId = null; // To store the ID of the logged-in user

document.addEventListener('DOMContentLoaded', function() {
    // --- Initialize DOM Elements ---
    authSection = document.getElementById('auth-section');
    appSection = document.getElementById('app-section');
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
            currentUserId = user.id; // currentUserId is now global
            if (userGreeting) userGreeting.textContent = user.username; // userGreeting is now global
            if (authSection) authSection.style.display = 'none'; // authSection is now global
            if (appSection) appSection.style.display = 'block'; // appSection is now global
            
            // Call the newly defined functions
            loadAlbums();
            loadMyPhotos(false); // Assuming false means don't force refresh or similar logic
            loadAllPhotos();

        } else {
            clearAuthState();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        clearAuthState();
    }
}

function clearAuthState() {
    currentUserId = null; // currentUserId is now global
    if (authSection) authSection.style.display = 'block'; // authSection is now global
    if (appSection) appSection.style.display = 'none'; // appSection is now global
    clearGalleriesAndAlbumInfo();
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

// Hilfsfunktion zum Rendern von Fotos in einem Galerie-Element
function renderPhotos(galleryElement, photos, placeholderMessage = 'Keine Fotos gefunden.') {
    if (!galleryElement) return;
    galleryElement.innerHTML = ''; // Vorherige Fotos löschen

    if (photos && photos.length > 0) {
        photos.forEach(photo => {
            const photoContainer = document.createElement('div');
            photoContainer.classList.add('photo-item'); // Für späteres Styling

            const img = document.createElement('img');
            // Annahme: Fotos sind im Ordner /uploads/ und der Dateiname ist in photo.filename gespeichert
            img.src = `/uploads/${photo.filename}`; 
            img.alt = photo.filename;
            img.style.maxWidth = '200px'; // Einfaches Styling
            img.style.maxHeight = '200px';
            img.style.margin = '5px';

            // Optional: Weitere Infos zum Foto anzeigen
            // const photoInfo = document.createElement('p');
            // photoInfo.textContent = `ID: ${photo.id}`;
            // photoContainer.appendChild(photoInfo);

            photoContainer.appendChild(img);
            galleryElement.appendChild(photoContainer);
        });
    } else {
        galleryElement.innerHTML = `<p>${placeholderMessage}</p>`;
    }
}


async function loadAlbums() {
    if (!albumsListDiv || !albumSelectUpload) {
        console.warn('Album list or select upload element not found.');
        return;
    }

    albumsListDiv.innerHTML = '<p>Lade Alben...</p>';
    // Standardoption im Upload-Select beibehalten und nur die Album-Optionen löschen
    const firstOption = albumSelectUpload.options[0];
    albumSelectUpload.innerHTML = '';
    albumSelectUpload.appendChild(firstOption);


    try {
        const response = await fetch('/api/albums'); // Annahme: API-Endpunkt für Alben des Benutzers
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Fehler beim Laden der Alben.' }));
            throw new Error(errorData.message || `Fehler: ${response.status}`);
        }
        const albums = await response.json();

        albumsListDiv.innerHTML = ''; // Vorherige Liste leeren

        if (albums && albums.length > 0) {
            albums.forEach(album => {
                // Album zur Liste hinzufügen
                const albumElement = document.createElement('div');
                albumElement.classList.add('album-item'); // Für Styling
                albumElement.textContent = album.name;
                albumElement.style.cursor = 'pointer';
                albumElement.style.padding = '5px';
                albumElement.style.borderBottom = '1px solid #eee';

                albumElement.addEventListener('click', () => {
                    if (currentAlbumTitle) currentAlbumTitle.textContent = `Fotos im Album: ${album.name}`;
                    loadPhotosForAlbum(album.id);
                });
                albumsListDiv.appendChild(albumElement);

                // Album zum Upload-Select hinzufügen
                const option = document.createElement('option');
                option.value = album.id;
                option.textContent = album.name;
                albumSelectUpload.appendChild(option);
            });
        } else {
            albumsListDiv.innerHTML = '<p>Noch keine Alben erstellt.</p>';
        }
    } catch (error) {
        console.error('Fehler beim Laden der Alben:', error);
        albumsListDiv.innerHTML = `<p>${error.message || 'Ein Fehler ist beim Laden der Alben aufgetreten.'}</p>`;
    }
}

async function loadMyPhotos(forceRefresh = false) {
    if (!myPhotosGallery) {
        console.warn('My photos gallery element (#photo-gallery) not found.');
        return;
    }
    myPhotosGallery.innerHTML = '<p>Lade meine Fotos...</p>';

    try {
        const response = await fetch('/api/photos/mine'); // API endpoint for user's photos
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Fehler beim Laden meiner Fotos.' }));
            throw new Error(errorData.message || `Fehler: ${response.status}`);
        }
        const photos = await response.json();
        renderPhotos(myPhotosGallery, photos, 'Du hast noch keine Fotos hochgeladen.');

    } catch (error) {
        console.error('Fehler beim Laden meiner Fotos:', error);
        myPhotosGallery.innerHTML = `<p>${error.message || 'Ein Fehler ist beim Laden meiner Fotos aufgetreten.'}</p>`;
    }
}

async function loadAllPhotos() {
    if (!globalPhotosGallery) {
        console.warn('Global photos gallery element (#photo-gallery-all) not found.');
        return;
    }
    globalPhotosGallery.innerHTML = '<p>Lade alle Fotos...</p>';

    try {
        const response = await fetch('/api/photos/all'); // API endpoint for all photos
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Fehler beim Laden aller Fotos.' }));
            throw new Error(errorData.message || `Fehler: ${response.status}`);
        }
        const photos = await response.json();
        renderPhotos(globalPhotosGallery, photos, 'Es sind noch keine Fotos vorhanden.');

    } catch (error) {
        console.error('Fehler beim Laden aller Fotos:', error);
        globalPhotosGallery.innerHTML = `<p>${error.message || 'Ein Fehler ist beim Laden aller Fotos aufgetreten.'}</p>`;
    }
}

// Funktion zum Laden von Fotos für ein spezifisches Album
async function loadPhotosForAlbum(albumId) {
    if (!albumPhotoGalleryDiv || !currentAlbumTitle) {
        console.warn('Album photo gallery or current album title element not found.');
        return;
    }
    // Titel wird bereits beim Klick in loadAlbums gesetzt, hier nur Ladezustand
    albumPhotoGalleryDiv.innerHTML = '<p>Lade Fotos für das ausgewählte Album...</p>';

    try {
        const response = await fetch(`/api/albums/${albumId}/photos`); // Annahme: API-Endpunkt
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Fehler beim Laden der Fotos für das Album.' }));
            throw new Error(errorData.message || `Fehler: ${response.status}`);
        }
        const photos = await response.json();
        renderPhotos(albumPhotoGalleryDiv, photos, 'Keine Fotos in diesem Album gefunden.');

    } catch (error) {
        console.error(`Fehler beim Laden der Fotos für Album ${albumId}:`, error);
        if (currentAlbumTitle) currentAlbumTitle.textContent = 'Fotos im ausgewählten Album'; // Titel zurücksetzen bei Fehler
        albumPhotoGalleryDiv.innerHTML = `<p>${error.message || 'Ein Fehler ist beim Laden der Fotos aufgetreten.'}</p>`;
    }
}