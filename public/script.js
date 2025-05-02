document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const authSection = document.getElementById('auth-section');
    const appSection = document.getElementById('app-section');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const uploadForm = document.getElementById('upload-form');
    const logoutButton = document.getElementById('logout-button');
    const userGreeting = document.getElementById('user-greeting');
    const photoGallery = document.getElementById('photo-gallery'); // Keep this single declaration
    const photoInput = document.getElementById('photo-input'); // Keep this single declaration

    // --- Message elements ---
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');
    const uploadMessage = document.getElementById('upload-message'); // Keep this single declaration

    // --- Event Listeners ---
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    // Removed the first uploadForm listener, keep the async one below
    logoutButton.addEventListener('click', handleLogout);

    // --- Functions ---

    // Function to check authentication status
    function checkAuthStatus() {
        fetch('/api/users/me')
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    // Clear any previous user greeting if not authenticated
                    userGreeting.textContent = '';
                    throw new Error('Not authenticated');
                }
            })
            .then(user => {
                // User is logged in
                userGreeting.textContent = user.username;
                authSection.style.display = 'none';
                appSection.style.display = 'block';
                loadMyPhotos(); // Corrected function name call
            })
            .catch(error => {
                // User is not logged in
                console.log('Authentication check failed:', error.message);
                authSection.style.display = 'block';
                appSection.style.display = 'none';
                // Clear photo gallery if user logs out or fails auth check
                photoGallery.innerHTML = '';
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

    // Removed the old handleUpload function as it was redundant

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

    // Function to load user's photos
    async function loadMyPhotos() {
        // Clear gallery before loading
        photoGallery.innerHTML = '<p>Lade Fotos...</p>';
        try {
            const response = await fetch('/api/photos/my');
            if (!response.ok) {
                if (response.status === 401) {
                    console.log('Not logged in, cannot load photos.');
                    // No need to update gallery here, checkAuthStatus handles hiding/showing sections
                    return;
                }
                // Try to get error message from server response
                let errorMsg = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch (e) { /* Ignore if response is not JSON */ }
                throw new Error(errorMsg);
            }
            const photos = await response.json();

            photoGallery.innerHTML = ''; // Clear loading message

            if (photos.length === 0) {
                photoGallery.innerHTML = '<p>You have not uploaded any photos yet.</p>';
            } else {
                photos.forEach(photo => {
                    const container = document.createElement('div');
                    container.classList.add('photo-container');
                    container.dataset.photoId = photo.id;

                    const img = document.createElement('img');
                    img.src = `/uploads/${photo.filename}`;
                    img.alt = `Photo by User`; // More descriptive alt text if possible
                    // Add error handling for broken images
                    img.onerror = () => {
                        console.error(`Failed to load image: /uploads/${photo.filename}`);
                        container.innerHTML = '<p style="color: red;">Bild nicht ladbar</p>'; // Indicate broken image
                    };


                    const overlay = document.createElement('div');
                    overlay.classList.add('photo-overlay');

                    const deleteButton = document.createElement('button');
                    deleteButton.classList.add('delete-button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.setAttribute('aria-label', `Delete photo ${photo.id}`); // Accessibility

                    overlay.appendChild(deleteButton);
                    container.appendChild(img);
                    container.appendChild(overlay);
                    photoGallery.appendChild(container);
                });
            }
        } catch (error) {
            console.error('Error loading photos:', error);
            photoGallery.innerHTML = `<p style="color: red;">Fehler beim Laden der Fotos: ${error.message}. Bitte versuchen Sie es später erneut.</p>`;
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

    // Event Listener for Deleting Photos (using event delegation)
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
    checkAuthStatus(); // Corrected initial function call
});