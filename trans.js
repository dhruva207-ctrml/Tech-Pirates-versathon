/* HELPERS */
const qs = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);
const todayStr = () => new Date().toISOString().split("T")[0];
const formatMoney = n => "₹" + n.toLocaleString();

/* STATE */
let state = {
  transactions: JSON.parse(localStorage.getItem("finwise_txns") || "[]")
};

const saveState = () => {
  localStorage.setItem("finwise_txns", JSON.stringify(state.transactions));
};

/* INIT */
qs("#txnDate").value = todayStr();

qs("#txnForm").addEventListener("submit", e => {
  e.preventDefault();
  addTransaction();
});

qs("#clearAll").onclick = () => {
  if (confirm("Delete all transactions?")) {
    state.transactions = [];
    saveState();
    renderTransactions();
  }
};

qs("#exportTxn").onclick = exportTransactions;

/* CORE */
function addTransaction() {
  const txn = {
    id: Date.now(),
    type: qs("#txnType").value,
    category: qs("#txnCategory").value,
    amount: Number(qs("#txnAmount").value),
    date: qs("#txnDate").value,
    note: qs("#txnNote").value
  };

  if (!txn.amount) return;

  state.transactions.push(txn);
  saveState();
  qs("#txnForm").reset();
  qs("#txnDate").value = todayStr();
  renderTransactions();
}

/* FILTER LOGIC */
const searchInput = qs("#searchInput");
const filterType = qs("#filterType");
const filterMonth = qs("#filterMonth");

[searchInput, filterType, filterMonth].forEach(el => {
  el.addEventListener("input", renderTransactions);
  el.addEventListener("change", renderTransactions);
});

function renderTransactions() {
  const tbody = qs("#txnTableBody");
  tbody.innerHTML = "";

  // 1. Get Filter Values
  const searchTerm = searchInput.value.toLowerCase();
  const typeValue = filterType.value;
  const monthValue = filterMonth.value;

  // 2. Filter Data
  const filtered = state.transactions.filter(txn => {
    // Text Search (Category or Note)
    const matchesSearch = (txn.category.toLowerCase().includes(searchTerm) ||
      (txn.note && txn.note.toLowerCase().includes(searchTerm)));

    // Type Filter
    const matchesType = (typeValue === "all") || (txn.type === typeValue);

    // Month Filter
    let matchesMonth = true;
    if (monthValue !== "all") {
      const txnDate = new Date(txn.date);
      matchesMonth = txnDate.getMonth() === parseInt(monthValue);
    }

    return matchesSearch && matchesType && matchesMonth;
  });

  qs("#txnCount").textContent = `(${filtered.length})`;

  // 3. Render
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #999;">No transactions found</td></tr>`;
  } else {
    filtered
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach(txn => {
        const tr = document.createElement("tr");
        // Determine color for amount
        const isExp = txn.type === 'expense';
        const amtClass = isExp ? 'negative' : 'positive';
        const amtSign = isExp ? '-' : '+';
        const amtColor = isExp ? '#DC2626' : '#16A34A';

        tr.innerHTML = `
            <td>${txn.date}</td>
            <td><span style="background:${isExp ? '#fee2e2' : '#dcfce7'}; color:${amtColor}; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize;">${txn.type}</span></td>
            <td>${txn.category}</td>
            <td style="color:${amtColor}; font-weight:600;">${amtSign}${formatMoney(txn.amount)}</td>
            <td>${txn.note || "-"}</td>
            <td><button class="delete-btn" data-id="${txn.id}"><i class="fas fa-trash"></i></button></td>
          `;
        tbody.appendChild(tr);
      });
  }

  qsa(".delete-btn").forEach(btn => {
    btn.onclick = () => {
      if (confirm('Delete this transaction?')) {
        state.transactions = state.transactions.filter(t => t.id != btn.dataset.id);
        saveState();
        renderTransactions();
      }
    };
  });

  renderMonthlyStats();
}

function renderMonthlyStats() {
  const now = new Date();
  let income = 0, expense = 0;

  state.transactions.forEach(t => {
    const d = new Date(t.date);
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      t.type === "income" ? income += t.amount : expense += t.amount;
    }
  });

  qs("#monthIncome").textContent = formatMoney(income);
  const bal = income - expense;
  qs("#monthBalance").textContent = formatMoney(bal);
  qs("#monthBalance").className = `stat-change ${bal >= 0 ? "positive" : "negative"}`;
}

function exportTransactions() {
  let csv = "Date,Type,Category,Amount,Note\n";
  state.transactions.forEach(t => {
    csv += `${t.date},${t.type},${t.category},${t.amount},"${t.note || ""}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "finwise_transactions.csv";
  a.click();
}

/* INITIAL */
renderTransactions();
