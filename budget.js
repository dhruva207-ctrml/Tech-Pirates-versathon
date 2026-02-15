
// DOM Elements
const budgetGrid = document.getElementById('budgetGrid');
const budgetModal = document.getElementById('budgetModal');
const totalBudgetEl = document.getElementById('totalBudget');
const totalSpentEl = document.getElementById('totalSpent');
const totalRemainingEl = document.getElementById('totalRemaining');
const monthSelector = document.getElementById('monthSelector');

// State
let budgets = [];
let currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

// Category Colors
const categoryColors = {
    'Housing': '#3b82f6',
    'Groceries': '#22c55e',
    'Transportation': '#a855f7',
    'Utilities': '#f59e0b',
    'Dining': '#ef4444',
    'Entertainment': '#ec4899',
    'Health': '#06b6d4',
    'Shopping': '#8b5cf6',
    'Personal': '#14b8a6',
    'Education': '#f97316',
    'Debt': '#ef4444',
    'Savings': '#10b981',
    'Other': '#64748b'
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Set today's month as default value in selectors
    if (monthSelector) {
        monthSelector.value = currentMonth;
        // Listen to changes
        monthSelector.addEventListener('change', (e) => {
            currentMonth = e.target.value;
            renderBudgets();
        });
    }

    // Load from storage
    loadBudgets();
    renderBudgets();
});

// Load/Save Logic
function loadBudgets() {
    const stored = localStorage.getItem('finwise_budgets');
    if (stored) {
        budgets = JSON.parse(stored);
    } else {
        // Default dummy data if empty
        budgets = [
            { id: 1, category: 'Housing', limit: 1900, spent: 1800, month: currentMonth },
            { id: 2, category: 'Groceries', limit: 400, spent: 320, month: currentMonth },
            { id: 3, category: 'Transportation', limit: 300, spent: 150, month: currentMonth },
            { id: 4, category: 'Dining', limit: 200, spent: 180, month: currentMonth }
        ];
        saveBudgets();
    }
}

function saveBudgets() {
    localStorage.setItem('finwise_budgets', JSON.stringify(budgets));
    // Trigger update on home page widget if script.js is listening (it polls or reloads)
}

// Modal Logic
function openBudgetModal() {
    budgetModal.classList.add('show');
    // Default month to current selection
    document.getElementById('budgetMonth').value = currentMonth;

    // Reset inputs
    document.getElementById('budgetCategory').value = "";
    document.getElementById('budgetLimit').value = "";
    document.getElementById('budgetSpent').value = "";
}

function closeBudgetModal() {
    budgetModal.classList.remove('show');
}

window.onclick = function (event) {
    if (event.target == budgetModal) {
        closeBudgetModal();
    }
}

// Create/Update Budget
function saveBudget() {
    const category = document.getElementById('budgetCategory').value;
    const limit = parseFloat(document.getElementById('budgetLimit').value);
    const spent = parseFloat(document.getElementById('budgetSpent').value) || 0;
    const month = document.getElementById('budgetMonth').value;

    if (!category || !limit || !month) {
        alert("Please fill in required fields");
        return;
    }

    // Check if budget exists for this category and month
    const existingIndex = budgets.findIndex(b => b.category === category && b.month === month);

    if (existingIndex >= 0) {
        // Update existing (maybe prompt user? for now just overwrite logic)
        budgets[existingIndex].limit = limit;
        if (spent > 0) budgets[existingIndex].spent = spent;
        // Note: keeping existing spent if 0 input meant "no change" is ambiguous, 
        // but here let's assume if user inputs 0 (which is default placeholder) we might want to keep it?
        // Let's rely on the input being empty vs 0. 
        // Simple logic: overwrite
        if (document.getElementById('budgetSpent').value !== "") {
            budgets[existingIndex].spent = spent;
        }
    } else {
        // Create new
        budgets.push({
            id: Date.now(),
            category,
            limit,
            spent,
            month
        });
    }

    saveBudgets();
    closeBudgetModal();

    // Refresh view if added to currently viewed month
    if (month === currentMonth) {
        renderBudgets();
    } else {
        // Optionally switch to that month or stay
        monthSelector.value = month;
        currentMonth = month;
        renderBudgets();
    }
}

// Render Logic
function renderBudgets() {
    const monthBudgets = budgets.filter(b => b.month === currentMonth);

    // Clear grid
    budgetGrid.innerHTML = '';

    let totalLimit = 0;
    let totalSpent = 0;

    monthBudgets.forEach(b => {
        totalLimit += b.limit;
        totalSpent += b.spent;

        const remaining = b.limit - b.spent;
        const percent = Math.min((b.spent / b.limit) * 100, 100);
        const color = categoryColors[b.category] || categoryColors['Other'];

        // Status color for remaining text
        let statusClass = '';
        if (percent > 90) statusClass = 'danger';
        else if (percent > 75) statusClass = 'warning';

        const card = document.createElement('div');
        card.className = 'budget-card';
        card.innerHTML = `
            <div class="card-header">
                <div class="category-info">
                    <div class="dot" style="background: ${color}"></div>
                    ${b.category}
                </div>
                <button class="options-btn" onclick="deleteBudget(${b.id})"><i class="fas fa-trash-alt"></i></button>
            </div>
            
            <div class="amount-info">
                <div>
                    <div class="spent">₹${b.spent.toLocaleString()}</div>
                    <div class="limit">of ₹${b.limit.toLocaleString()}</div>
                </div>
                <div class="left-amount ${statusClass}">
                    ₹${Math.max(remaining, 0).toLocaleString()} left
                </div>
            </div>
            
            <div class="progress-container">
                <div class="progress-bar" style="width: ${percent}%; background: ${percent > 100 ? '#ef4444' : '#0f172a'}"></div>
            </div>
            
            <div class="percentage">
                ${Math.round(percent)}% used
            </div>
        `;

        budgetGrid.appendChild(card);
    });

    // Update Summary
    totalBudgetEl.innerText = `₹${totalLimit.toLocaleString()}`;
    totalSpentEl.innerText = `₹${totalSpent.toLocaleString()}`;
    const totalRemaining = totalLimit - totalSpent;
    totalRemainingEl.innerText = `₹${totalRemaining.toLocaleString()}`;

    if (totalRemaining < 0) {
        totalRemainingEl.classList.remove('green');
        totalRemainingEl.classList.add('danger'); // Reuse danger class or add logic
        totalRemainingEl.style.color = '#ef4444';
    } else {
        totalRemainingEl.style.color = '#22c55e';
    }
}

function deleteBudget(id) {
    if (confirm("Delete this budget?")) {
        budgets = budgets.filter(b => b.id !== id);
        saveBudgets();
        renderBudgets();
    }
}
