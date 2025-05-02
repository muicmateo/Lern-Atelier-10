document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const authSection = document.getElementById('auth-section');
    const appSection = document.getElementById('app-section');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const uploadForm = document.getElementById('upload-form');
    const logoutButton = document.getElementById('logout-button');
    const userGreeting = document.getElementById('user-greeting');
    const photoGallery = document.getElementById('photo-gallery');
    const photoGalleryAll = document.getElementById('photo-gallery-all');
    const photoInput = document.getElementById('photo-input'); // Make sure this is declared

    // --- Message elements ---
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');
    const uploadMessage = document.getElementById('upload-message'); // Ensure this is declared

  
    // Remove or comment out: captionText, prevBtn, nextBtn, galleryItems, currentIndex

    // --- Event Listeners ---
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    uploadForm.addEventListener('submit', handleUpload); // This line expects a function named handleUpload
    logoutButton.addEventListener('click', handleLogout);

    // Add delegated event listener for clicking images in BOTH galleries
    document.body.addEventListener('click', handleImageClick); // Listen on body

    // --- Functions ---

    // Function to check authentication status
    function checkAuthStatus() {
        fetch('/api/users/me')
            .then(response => {
                if (response.ok) return response.json();
                userGreeting.textContent = '';
                throw new Error('Not authenticated');
            })
            .then(user => {
                userGreeting.textContent = user.username;
                authSection.style.display = 'none';
                appSection.style.display = 'block';
                // Load photos without setupGalleryItems
                Promise.all([loadMyPhotos(false), loadMyPhotos(true)]);
            })
            .catch(error => {
                console.log('Authentication check failed:', error.message);
                authSection.style.display = 'block';
                appSection.style.display = 'none';
                photoGallery.innerHTML = '';
                if (photoGalleryAll) photoGalleryAll.innerHTML = '';
                // Remove this line as galleryItems is not defined
                // galleryItems = []; 
            });
    }

    // Function to handle user login
    function handleLogin(event) {
        event.preventDefault();
        loginMessage.textContent = ''; // Clear previous messages
        loginMessage.className = 'message';

        const usernameOrEmail = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usernameOrEmail, password })
        })
        .then(async response => { // Make async to parse JSON even on error
            const data = await response.json();
            if (!response.ok) {
                // Throw an error with the message from the server
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            return data; // Return data on success
        })
        .then(data => {
            loginMessage.textContent = 'Login erfolgreich!';
            loginMessage.className = 'message success'; // Use success class
            loginForm.reset(); // Reset form on successful login
            checkAuthStatus(); // Refresh auth status and load app section
        })
        .catch(error => {
            loginMessage.textContent = error.message || 'Ein Fehler ist aufgetreten.';
            loginMessage.className = 'message error'; // Use error class
            console.error('Login error:', error);
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
                 // Throw an error with the message from the server
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
            // Optionally inform the user about the logout error
            alert('Logout fehlgeschlagen. Bitte versuchen Sie es erneut.');
            // Still try to refresh status, might partially work
            checkAuthStatus();
        });
    }

    // --- Photo Management ---
    // Variables photoGallery, uploadForm, photoInput, uploadMessage are already declared above

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
                 // Throw an error with the message from the server or a default one
                throw new Error(data.message || `Upload fehlgeschlagen: ${response.statusText}`);
            }
            return data; // Return data on success
        })
        .then(data => {
            uploadMessage.textContent = 'Foto erfolgreich hochgeladen!';
            uploadMessage.className = 'message success';
            uploadForm.reset(); // Clear the form
            loadMyPhotos(false); // Reload the user's photo gallery
            loadMyPhotos(true); // Reload the 'all photos' gallery if needed
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
        const targetGallery = getAll ? photoGalleryAll : photoGallery;
        const endpoint = getAll ? '/api/photos/all' : '/api/photos/my';

        if (!targetGallery) {
            console.error(`Gallery element not found for getAll=${getAll}`);
            return;
        }
        targetGallery.innerHTML = '<p>Lade Fotos...</p>';

        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                // Try to get error message from server response
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
                    container.dataset.photoId = photo.id;

                    // Create a link for Lightbox
                    const link = document.createElement('a');
                    link.href = `/uploads/${photo.filename}`;
                    link.dataset.lightbox = getAll ? "all-photos" : "my-photos"; // Group photos
                    
                    const altText = getAll && photo.username ? `Photo by ${photo.username}` : `Photo ID ${photo.id}`;
                    link.dataset.title = altText; // This becomes the caption in Lightbox

                    const img = document.createElement('img');
                    img.src = `/uploads/${photo.filename}`;
                    img.alt = altText;

                    img.onerror = () => {
                        console.error(`Failed to load image: /uploads/${photo.filename}. Removing container.`);
                        container.remove();
                    };

                    // Add the image to the link
                    link.appendChild(img);

                    const overlay = document.createElement('div');
                    overlay.classList.add('photo-overlay');

                    if (!getAll) {
                        const deleteButton = document.createElement('button');
                        deleteButton.classList.add('delete-button');
                        deleteButton.textContent = 'Delete';
                        deleteButton.setAttribute('aria-label', `Delete photo ${photo.id}`);
                        overlay.appendChild(deleteButton);
                    } else {
                        if (photo.username) {
                            const usernameSpan = document.createElement('span');
                            usernameSpan.textContent = `By: ${photo.username}`;
                            usernameSpan.style.color = 'white';
                            usernameSpan.style.fontSize = '0.8em';
                            overlay.appendChild(usernameSpan);
                        }
                    }

                    container.appendChild(link);
                    container.appendChild(overlay);
                    targetGallery.appendChild(container);
                });
            }
        } catch (error) {
            console.error(`Error loading photos (getAll=${getAll}):`, error);
            targetGallery.innerHTML = `<p style="color: red;">Fehler beim Laden der Fotos: ${error.message}.</p>`;
        }
    }

    // Event listener for photo uploads (Async version - KEEP THIS ONE)
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        uploadMessage.textContent = 'Uploading...'; // Provide feedback during upload
        uploadMessage.className = 'message';

        if (!photoInput.files || photoInput.files.length === 0) {
             uploadMessage.textContent = 'Bitte wählen Sie eine Datei aus.';
             uploadMessage.className = 'message error';
             return;
        }

        const formData = new FormData();
        formData.append('photo', photoInput.files[0]);

        try {
            const response = await fetch('/api/photos/upload', {
                method: 'POST',
                body: formData
            });
            const result = await response.json(); // Always try to parse JSON

            if (!response.ok) {
                 // Throw error using server message if available
                 throw new Error(result.message || `Upload failed with status: ${response.status}`);
            }

            uploadMessage.textContent = result.message || 'Foto erfolgreich hochgeladen!';
            uploadMessage.className = 'message success';
            uploadForm.reset(); // Clear the form
            loadMyPhotos(); // Reload photos to show the new one

        } catch (error) {
            console.error('Error uploading photo:', error);
            uploadMessage.textContent = error.message || 'Upload fehlgeschlagen. Bitte versuchen Sie es erneut.';
            uploadMessage.className = 'message error';
        }
    });

    // Event listener for photo deletions
    photoGallery.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-button')) {
            const photoContainer = event.target.closest('.photo-container');
            if (photoContainer) {
                const photoId = photoContainer.dataset.photoId;
                if (photoId && confirm(`Sind Sie sicher, dass Sie dieses Foto löschen möchten?`)) { // Confirmation in German
                    try {
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
                        if (photoGallery.children.length === 0) {
                             photoGallery.innerHTML = '<p>You have not uploaded any photos yet.</p>';
                        }
                    } catch (error) {
                        console.error('Error deleting photo:', error);
                        alert(`Fehler beim Löschen des Fotos: ${error.message}`); // Show specific error
                    }
                }
            }
        }
    });


    // --- Initial Check ---
    checkAuthStatus();
}); // End of DOMContentLoaded