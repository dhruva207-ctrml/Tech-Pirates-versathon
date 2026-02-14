// Google Login Simulation
function googleLogin(action) {
    alert("Redirecting to Google Authentication...");
    setTimeout(() => {
        // Simulate successful login/signup with Google
        const username = localStorage.getItem('finwise_username');

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

    // Dashboard Logic
    const headerUsername = document.getElementById('headerUsername'); // Keep for compatibility if used elsewhere
    const sidebarUsername = document.getElementById('sidebarUsername');

    if (sidebarUsername || headerUsername) {
        const username = localStorage.getItem('finwise_username');
        const profileDataStr = localStorage.getItem('finwise_user_profile');

        const displayName = username || "Guest";

        if (headerUsername) headerUsername.textContent = displayName;
        if (sidebarUsername) sidebarUsername.textContent = "Welcome, " + displayName;

        // Populate Dashboard Cards
        if (profileDataStr) {
            const data = JSON.parse(profileDataStr);
            const income = parseFloat(data.monthlySalary) || 0;
            const otherIncome = parseFloat(data.otherIncome) || 0;
            const expenses = parseFloat(data.monthlyExpenses) || 0;
            const savings = parseFloat(data.totalSavings) || 0;
            const totalIncome = income + otherIncome;
            const cashFlow = totalIncome - expenses;

            const formatCurrency = (num) => {
                return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };

            const displayIncome = document.getElementById('displayIncome');
            const displayExpenses = document.getElementById('displayExpenses');
            const displayCashFlow = document.getElementById('displayCashFlow');
            const displaySavings = document.getElementById('displaySavings');

            if (displayIncome) displayIncome.textContent = formatCurrency(totalIncome);
            if (displayExpenses) displayExpenses.textContent = formatCurrency(expenses);
            if (displayCashFlow) {
                displayCashFlow.textContent = (cashFlow >= 0 ? '+' : '') + formatCurrency(cashFlow);
                displayCashFlow.style.color = cashFlow >= 0 ? '#10b981' : '#ef4444'; // Green if positive, Red if negative
            }
            if (displaySavings) displaySavings.textContent = formatCurrency(savings);
        }

        // Load Recent Transactions
        loadTransactions();
    }

    // Settings Logic
    const settingsIcon = document.getElementById('settingsIcon');
    const settingsDropdown = document.getElementById('settingsDropdown');

    if (settingsIcon && settingsDropdown) {
        settingsIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsDropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!settingsIcon.contains(e.target) && !settingsDropdown.contains(e.target)) {
                settingsDropdown.classList.remove('active');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            localStorage.setItem('finwise_user_email', email);
            window.location.href = 'index.html';
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            localStorage.setItem('finwise_user_email', email);
            alert("Account created successfully!");
            window.location.href = 'profile-setup.html';
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const profileData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                jobTitle: document.getElementById('jobTitle').value,
                companyName: document.getElementById('companyName').value,
                monthlySalary: document.getElementById('monthlySalary').value,
                otherIncome: document.getElementById('otherIncome').value,
                totalSavings: document.getElementById('totalSavings').value,
                monthlyExpenses: document.getElementById('monthlyExpenses').value
            };

            localStorage.setItem('finwise_user_profile', JSON.stringify(profileData));
            localStorage.setItem('finwise_username', profileData.firstName);

            alert("Profile setup complete! Welcome, " + profileData.firstName);
            window.location.href = 'index.html';
        });
    }
});

function logout() {
    localStorage.removeItem('finwise_username');
    localStorage.removeItem('finwise_user_email');
    localStorage.removeItem('finwise_user_profile');
    window.location.href = 'login.html';
}

// Profile Modal Logic
function openProfileModal() {
    const modal = document.getElementById('profileModal');
    const profileDetails = document.getElementById('profileDetails');
    const profileDataStr = localStorage.getItem('finwise_user_profile');

    if (modal) {
        modal.classList.add('active');

        if (profileDataStr) {
            const data = JSON.parse(profileDataStr);
            profileDetails.innerHTML = `
                <div class="profile-field">
                    <div class="profile-label">Name</div>
                    <div class="profile-value">${data.firstName} ${data.lastName}</div>
                </div>
                <div class="profile-field">
                    <div class="profile-label">Job Title</div>
                    <div class="profile-value">${data.jobTitle} at ${data.companyName}</div>
                </div>
                <div class="profile-field">
                    <div class="profile-label">Monthly Income</div>
                    <div class="profile-value">₹${data.monthlySalary} <span style="font-size: 12px; color: #666;">(+ ₹${data.otherIncome || 0} other)</span></div>
                </div>
                <div class="profile-field">
                    <div class="profile-label">Total Savings</div>
                    <div class="profile-value">₹${data.totalSavings}</div>
                </div>
                <div class="profile-field">
                    <div class="profile-label">Monthly Expenses</div>
                    <div class="profile-value">₹${data.monthlyExpenses}</div>
                </div>
            `;
        } else {
            profileDetails.innerHTML = '<p style="text-align: center; color: #666;">No profile data found. Please complete profile setup.</p>';
        }

        // Close when clicking outside content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeProfileModal();
            }
        });
    }
}



// Helper to load dummy transactions
function loadTransactions() {
    const transactionList = document.getElementById('transactionList');
    if (transactionList) {
        // Dummy Data - In a real app, this would come from an API based on userId
        const transactions = [
            { id: 1, name: "Grocery Store", category: "Food & Dining", date: "Today", amount: -1200.50, type: "expense" },
            { id: 2, name: "Salary Deposit", category: "Income", date: "Yesterday", amount: 50000.00, type: "income" },
            { id: 3, name: "Electric Bill", category: "Utilities", date: "Feb 14", amount: -8500.00, type: "expense" },
            { id: 4, name: "Freelance Project", category: "Income", date: "Feb 12", amount: 15000.00, type: "income" },
            { id: 5, name: "Netflix Subscription", category: "Entertainment", date: "Feb 10", amount: -499.00, type: "expense" }
        ];

        let html = '';
        transactions.forEach(t => {
            const isExpense = t.type === 'expense';
            const bgClass = isExpense ? 't-bg-red' : 't-bg-green';
            const textClass = isExpense ? 'text-red' : 'text-green';
            const icon = isExpense ? 'fa-shopping-bag' : 'fa-wallet';
            const sign = isExpense ? '-' : '+';
            const color = isExpense ? '#ef4444' : '#10b981';

            html += `
            <div class="transaction-item">
                <div class="t-left">
                    <div class="t-icon ${bgClass}">
                        <i class="fas ${icon}" style="color: ${color}"></i>
                    </div>
                    <div class="t-details">
                        <h5>${t.name}</h5>
                        <p>${t.category} • ${t.date}</p>
                    </div>
                </div>
                <div class="t-amount ${textClass}">
                    ${sign}₹${Math.abs(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
            </div>
            `;
        });

        transactionList.innerHTML = html;
    }
}
