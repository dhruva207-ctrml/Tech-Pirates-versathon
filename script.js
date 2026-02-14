// Google Login Simulation
function googleLogin(action) {
    alert("Redirecting to Google Authentication...");
    setTimeout(() => {
        // Simulate successful login/signup with Google
        const username = localStorage.getItem('fintech_username');

        if (action === 'login') {
            window.location.href = 'index.html';
        } else if (action === 'signup') {
            window.location.href = 'profile-setup.html';
        } else {
            // Fallback logic
            if (username) {
                window.location.href = 'index.html';
            } else {
                window.location.href = 'profile-setup.html';
            }
        }
    }, 1000);
}

// Handle Forms
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const profileForm = document.getElementById('profileForm');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;

            // For login, we now ALWAYS redirect to index.html, skipping profile setup
            // This assumes the user has already set up their profile or we don't force it on login
            // You might want to store the email to simulate a session
            localStorage.setItem('fintech_user_email', email);

            window.location.href = 'index.html';
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            // Simulate signup
            localStorage.setItem('fintech_user_email', email);
            alert("Account created successfully!");
            // Signup still goes to profile setup
            window.location.href = 'profile-setup.html';
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            localStorage.setItem('fintech_username', username);
            alert("Profile setup complete! Welcome, " + username);
            window.location.href = 'index.html';
        });
    }
});
