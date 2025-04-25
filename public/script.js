document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const authSection = document.getElementById('auth-section');
    const appSection = document.getElementById('app-section');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const uploadForm = document.getElementById('upload-form');
    const logoutButton = document.getElementById('logout-button');
    const userGreeting = document.getElementById('user-greeting');
    const photoGallery = document.getElementById('photo-gallery');
    
    // Message elements
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');
    const uploadMessage = document.getElementById('upload-message');
    
    // Check if user is logged in
    checkAuthStatus();
    
    // Event Listeners
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    uploadForm.addEventListener('submit', handleUpload);
    logoutButton.addEventListener('click', handleLogout); // Fixed: was 'submit', should be 'click'
    
    // Functions
    function checkAuthStatus() {
        fetch('/api/users/me')
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Not authenticated');
                }
            })
            .then(user => {
                // User is logged in
                userGreeting.textContent = user.username;
                authSection.style.display = 'none';
                appSection.style.display = 'block';
                loadPhotos();
            })
            .catch(error => {
                // User is not logged in
                authSection.style.display = 'block';
                appSection.style.display = 'none';
            });
    }
    
    function handleLogin(event) {
        event.preventDefault();
        
        const usernameOrEmail = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usernameOrEmail, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Login erfolgreich.') {
                loginMessage.textContent = 'Login erfolgreich!';
                loginMessage.className = 'message success';
                checkAuthStatus(); // Refresh auth status
            } else {
                loginMessage.textContent = data.message || 'Login fehlgeschlagen.';
                loginMessage.className = 'message';
            }
        })
        .catch(error => {
            loginMessage.textContent = 'Ein Fehler ist aufgetreten.';
            loginMessage.className = 'message';
            console.error('Login error:', error);
        });
    }
    
    function handleRegister(event) {
        event.preventDefault();
        
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
        .then(response => response.json())
        .then(data => {
            if (data.userId) {
                registerMessage.textContent = 'Registrierung erfolgreich! Sie können sich jetzt einloggen.';
                registerMessage.className = 'message success';
                registerForm.reset();
            } else {
                registerMessage.textContent = data.message || 'Registrierung fehlgeschlagen.';
                registerMessage.className = 'message';
            }
        })
        .catch(error => {
            registerMessage.textContent = 'Ein Fehler ist aufgetreten.';
            registerMessage.className = 'message';
            console.error('Registration error:', error);
        });
    }
    
    function handleUpload(event) {
        event.preventDefault();
        
        const photoInput = document.getElementById('photo-input');
        const formData = new FormData();
        
        if (photoInput.files.length > 0) {
            formData.append('photo', photoInput.files[0]);
            
            fetch('/api/photos/upload', { // <-- FIXED ENDPOINT
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.photo && data.photo.id) {
                    uploadMessage.textContent = 'Foto erfolgreich hochgeladen!';
                    uploadMessage.className = 'message success';
                    uploadForm.reset();
                    loadPhotos(); // Refresh photos
                } else {
                    uploadMessage.textContent = data.message || 'Upload fehlgeschlagen.';
                    uploadMessage.className = 'message';
                }
            })
            .catch(error => {
                uploadMessage.textContent = 'Ein Fehler ist aufgetreten.';
                uploadMessage.className = 'message';
                console.error('Upload error:', error);
            });
        } else {
            uploadMessage.textContent = 'Bitte wählen Sie ein Foto aus.';
            uploadMessage.className = 'message';
        }
    }
    
    function handleLogout() {
        fetch('/api/auth/logout', {
            method: 'POST'
        })
        .then(() => {
            checkAuthStatus(); // Refresh auth status
        })
        .catch(error => {
            console.error('Logout error:', error);
        });
    }
    
    function loadPhotos() {
        fetch('/api/photos/my')
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to load photos');
                }
            })
            .then(photos => {
                photoGallery.innerHTML = ''; // Clear gallery
                
                if (photos.length === 0) {
                    photoGallery.innerHTML = '<p>Keine Fotos gefunden. Laden Sie Ihr erstes Foto hoch!</p>';
                    return;
                }
                
                photos.forEach(photo => {
                    const imgElement = document.createElement('img');
                    imgElement.src = `/uploads/${photo.filename}`;
                    imgElement.alt = `Foto ${photo.id}`;
                    imgElement.title = `Hochgeladen am ${new Date(photo.upload_timestamp).toLocaleString()}`;
                    
                    photoGallery.appendChild(imgElement);
                });
            })
            .catch(error => {
                photoGallery.innerHTML = '<p>Fehler beim Laden der Fotos.</p>';
                console.error('Error loading photos:', error);
            });
    }
});