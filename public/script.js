document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const authSection = document.getElementById('auth-section');
    const appSection = document.getElementById('app-section');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');
    const userGreeting = document.getElementById('user-greeting');
    const logoutButton = document.getElementById('logout-button');
    const uploadForm = document.getElementById('upload-form');
    const photoInput = document.getElementById('photo-input');
    const uploadMessage = document.getElementById('upload-message');
    const myPhotosGallery = document.getElementById('photo-gallery'); // For "My Photos (All)" - Renamed for clarity
    const globalPhotosGallery = document.getElementById('photo-gallery-all'); // For "All Fotos (Global)" - Renamed for clarity

    // New Album related DOM Elements
    const createAlbumForm = document.getElementById('create-album-form');
    const albumNameInput = document.getElementById('album-name-input');
    const albumMessage = document.getElementById('album-message');
    const albumsListDiv = document.getElementById('albums-list');
    const albumSelectUpload = document.getElementById('album-select-upload');
    const albumPhotoGalleryDiv = document.getElementById('album-photo-gallery');
    const currentAlbumTitle = document.getElementById('current-album-title');

    // Add a global keydown listener to handle Enter key when Lightbox is active
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            // Check if Lightbox is currently active and visible
            // Lightbox2 adds a div with id 'lightbox' and sets its display to 'block' when open
            const lightboxOverlay = document.getElementById('lightboxOverlay'); // Lightbox background
            const lightboxContainer = document.getElementById('lightbox');     // Lightbox main container

            // Check if either the overlay or the main container is visible
            const isLightboxVisible = (lightboxOverlay && getComputedStyle(lightboxOverlay).display !== 'none') ||
                                        (lightboxContainer && getComputedStyle(lightboxContainer).display !== 'none');

            if (isLightboxVisible) {
                // If Lightbox is visible, prevent the default action of the Enter key.
                // This stops it from "clicking" any focused button underneath (like logout).
                event.preventDefault();
            }
        }
    });

    // Set up event listeners
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    if (uploadForm) uploadForm.addEventListener('submit', handleUpload);
    if (createAlbumForm) createAlbumForm.addEventListener('submit', handleCreateAlbum);

    // --- Initial Check ---
    checkAuthStatus();
});

// --- Functions ---

// Function to display messages
function showMessage(element, message, isError = false) {
    if (element) {
        element.textContent = message;
        element.style.color = isError ? 'red' : 'green';
    }
}

// Function to check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
            const user = await response.json();
            currentUserId = user.id; // Store user ID
            if (userGreeting) userGreeting.textContent = user.username;
            if (authSection) authSection.style.display = 'none';
            if (appSection) appSection.style.display = 'block';
            loadAlbums(); // Load albums for the logged-in user
            loadMyPhotos(false); // Load all photos of the current user
            loadAllPhotos(); // Load all photos from all users
        } else {
            currentUserId = null;
            if (authSection) authSection.style.display = 'block';
            if (appSection) appSection.style.display = 'none';
            clearGalleriesAndAlbumInfo();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        if (authSection) authSection.style.display = 'block';
        if (appSection) appSection.style.display = 'none';
        clearGalleriesAndAlbumInfo();
    }
}

function clearGalleriesAndAlbumInfo() {
    if (myPhotosGallery) myPhotosGallery.innerHTML = '<p>Bitte einloggen, um Fotos zu sehen.</p>';
    if (globalPhotosGallery) globalPhotosGallery.innerHTML = '<p>Bitte einloggen, um Fotos zu sehen.</p>';
    if (albumsListDiv) albumsListDiv.innerHTML = '<p>Bitte einloggen, um Alben zu sehen.</p>';
    if (albumPhotoGalleryDiv) albumPhotoGalleryDiv.innerHTML = '<p>Bitte ein Album auswählen.</p>';
    if (currentAlbumTitle) currentAlbumTitle.textContent = 'Fotos im ausgewählten Album';
    if (albumSelectUpload) albumSelectUpload.innerHTML = '<option value="">-- Album auswählen --</option>';
}

// Function to handle user login
function handleLogin(event) {
    event.preventDefault();
    loginMessage.textContent = ''; // Clear previous messages
    loginMessage.className = 'message';

    const usernameOrEmail = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    // Validate input
    if (!usernameOrEmail || !password) {
        loginMessage.textContent = 'Bitte geben Sie Benutzername/E-Mail und Passwort ein.';
        loginMessage.className = 'message error';
        return;
    }

    // Show loading message
    loginMessage.textContent = 'Anmeldung läuft...';
    loginMessage.className = 'message';

    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usernameOrEmail, password })
    })
    .then(response => {
        // First check if we can parse the response as JSON
        return response.json().then(data => {
            // Return both the response object and the parsed data
            return { response, data };
        }).catch(error => {
            // If JSON parsing fails, return response with null data
            console.error('Error parsing JSON response:', error);
            return { response, data: null };
        });
    })
    .then(({ response, data }) => {
        if (!response.ok) {
            // Handle error response
            const errorMessage = data && data.message ? data.message : `Login fehlgeschlagen: ${response.status} ${response.statusText}`;
            throw new Error(errorMessage);
        }

        // Handle successful login
        loginMessage.textContent = 'Login erfolgreich!';
        loginMessage.className = 'message success';
        document.getElementById('login-form').reset();
        checkAuthStatus(); // Refresh auth status and load app section
    })
    .catch(error => {
        console.error('Login error:', error);
        loginMessage.textContent = error.message || 'Ein Fehler ist aufgetreten bei der Anmeldung.';
        loginMessage.className = 'message error';
    });
}

// Function to handle user registration
function handleRegister(event) {
    event.preventDefault();
    registerMessage.textContent = ''; // Clear previous messages
    registerMessage.className = 'message';

    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
    })
    .then(async response => { // Make async to parse JSON even on error
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        return data; // Return data on success
    })
    .then(data => {
        registerMessage.textContent = 'Registrierung erfolgreich! Sie können sich jetzt einloggen.';
        registerMessage.className = 'message success'; // Use success class
        registerForm.reset();
    })
    .catch(error => {
        registerMessage.textContent = error.message || 'Ein Fehler ist aufgetreten.';
        registerMessage.className = 'message error'; // Use error class
        console.error('Registration error:', error);
    });
}

// Function to handle user logout
function handleLogout() {
    fetch('/api/auth/logout', {
        method: 'POST'
    })
    .then(response => {
         if (!response.ok) {
            // Even on logout, check for potential server errors
            throw new Error(`Logout request failed: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
         console.log('Logout successful:', data.message);
         checkAuthStatus(); // Refresh auth status (will hide app section)
    })
    .catch(error => {
        console.error('Logout error:', error);
        // Optionally inform the user about the logout error using showMessage
        showMessage(null, 'Logout fehlgeschlagen. Bitte versuchen Sie es erneut.', true);
        // Still try to refresh status, might partially work
        checkAuthStatus();
    });
}

// --- Photo Management ---
// Variables myPhotosGallery, globalPhotosGallery, uploadForm, photoInput, uploadMessage are already declared above

// Function to handle photo upload
function handleUpload(event) {
    event.preventDefault(); // Prevent default form submission
    uploadMessage.textContent = ''; // Clear previous messages
    uploadMessage.className = 'message';

    const photoFile = photoInput.files[0];
    if (!photoFile) {
        uploadMessage.textContent = 'Bitte wählen Sie eine Datei aus.';
        uploadMessage.className = 'message error';
        return;
    }

    const formData = new FormData();
    formData.append('photo', photoFile); // 'photo' must match the name attribute in HTML and multer field name in server.js

    uploadMessage.textContent = 'Lade Foto hoch...';
    uploadMessage.className = 'message'; // Neutral message during upload

    fetch('/api/photos/upload', {
        method: 'POST',
        body: formData // No 'Content-Type' header needed for FormData, browser sets it with boundary
        // Headers like 'Authorization' are usually handled by cookies/sessions here
    })
    .then(async response => {
        const data = await response.json(); // Try to parse JSON regardless of status
        if (!response.ok) {
            // Handle specific errors like 401 Unauthorized
            if (response.status === 401) {
                throw new Error('Nicht autorisiert. Bitte erneut einloggen.');
            }
            // Throw an error with the message from the server
            throw new Error(data.message || `Upload fehlgeschlagen: ${response.statusText}`);
        }
        return data; // Return data on success
    })
    .then(data => {
        uploadMessage.textContent = 'Foto erfolgreich hochgeladen!';
        uploadMessage.className = 'message success';
        uploadForm.reset(); // Clear the form
        loadMyPhotos(false); // Reload the user's photo gallery
        loadAllPhotos(); // Reload the 'all photos' gallery
    })
    .catch(error => {
        uploadMessage.textContent = `Fehler: ${error.message}`;
        uploadMessage.className = 'message error';
        console.error('Upload error:', error);
         // If unauthorized, redirect to login might be desired, or just show message
        if (error.message.includes('Nicht autorisiert')) {
             // Optional: Force a refresh of auth status to show login form
             checkAuthStatus();
        }
    });
}


// Function to load user's photos or all photos
async function loadMyPhotos(getAll = false) {
    const targetGallery = getAll ? globalPhotosGallery : myPhotosGallery;
    const endpoint = getAll ? '/api/photos/all' : '/api/photos/my';

    if (!targetGallery) {
        console.error(`Gallery element not found for getAll=${getAll}`);
        return;
    }
    targetGallery.innerHTML = '<p>Lade Fotos...</p>';

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
            } catch (e) { /* Ignore if response is not JSON */ }
            throw new Error(errorMsg);
        }
        const photos = await response.json();
        targetGallery.innerHTML = '';

        if (photos.length === 0) {
            targetGallery.innerHTML = getAll
                ? '<p>No photos have been uploaded by anyone yet.</p>'
                : '<p>You have not uploaded any photos yet.</p>';
        } else {
            photos.forEach(photo => {
                const container = document.createElement('div');
                container.classList.add('photo-container');
                // No longer need photoId for client-side delete button
                // container.dataset.photoId = photo.id;

                const link = document.createElement('a');
                link.href = `/uploads/${photo.filename}`;
                link.dataset.lightbox = getAll ? "all-photos-gallery" : "my-photos-gallery";

                const altText = getAll && photo.username ? `Photo by ${photo.username}` : `Photo ID ${photo.id}`;
                link.dataset.title = getAll && photo.username ? `Photo by ${photo.username} (ID: ${photo.id})` : `My Photo (ID: ${photo.id})`;

                const img = document.createElement('img');
                img.src = `/uploads/${photo.filename}`;
                img.alt = altText;

                img.onerror = () => {
                    console.error(`Failed to load image: /uploads/${photo.filename}. Removing container.`);
                    container.remove();
                };

                link.appendChild(img);

                // REMOVE OVERLAY AND DELETE BUTTON CREATION
                // const overlay = document.createElement('div');
                // overlay.classList.add('photo-overlay');
                // if (!getAll) {
                //     const deleteButton = document.createElement('button');
                //     deleteButton.classList.add('delete-button');
                //     deleteButton.textContent = 'Delete';
                //     deleteButton.setAttribute('aria-label', `Delete photo ${photo.id}`);
                //     overlay.appendChild(deleteButton);
                // } else {
                //     if (photo.username) {
                //         const usernameSpan = document.createElement('span');
                //         usernameSpan.textContent = `By: ${photo.username}`;
                //         usernameSpan.style.color = 'white';
                //         usernameSpan.style.fontSize = '0.8em';
                //         overlay.appendChild(usernameSpan);
                //     }
                // }

                container.appendChild(link);
                // container.appendChild(overlay); // REMOVE THIS LINE
                targetGallery.appendChild(container);
            });
        }
    } catch (error) {
        console.error(`Error loading photos (getAll=${getAll}):`, error);
        targetGallery.innerHTML = `<p style="color: red;">Fehler beim Laden der Fotos: ${error.message}.</p>`;
    }
}

// REMOVE OR SIMPLIFY handleImageClick as delete button is gone
// Clicks on images within <a> tags with data-lightbox will be handled by Lightbox2.
// function handleImageClick(event) {
//     const target = event.target;
//     if (target.classList.contains('delete-button')) {
//         // This logic is no longer needed
//     }
// }

// Function to delete a photo (KEEP THIS if you plan to add delete functionality back later,
// but it won't be called from the UI for now)
async function deletePhoto(photoId) {
    const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE'
    });

    const result = await response.json(); // Always try to parse JSON

    if (!response.ok) {
        // Throw error using server message if available
        throw new Error(result.message || `Delete failed with status: ${response.status}`);
    }

    alert(result.message || "Foto erfolgreich gelöscht."); // Show success message
    photoContainer.remove(); // Remove the photo element

    // Check if gallery is empty and show message
    if (myPhotosGallery.children.length === 0) {
        myPhotosGallery.innerHTML = '<p>You have not uploaded any photos yet.</p>';
    }
}

