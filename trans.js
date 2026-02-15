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

function renderTransactions() {
  const tbody = qs("#txnTableBody");
  tbody.innerHTML = "";
  qs("#txnCount").textContent = `(${state.transactions.length})`;

  state.transactions
    .sort((a,b)=>new Date(b.date)-new Date(a.date))
    .forEach(txn=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${txn.date}</td>
        <td>${txn.type}</td>
        <td>${txn.category}</td>
        <td>${formatMoney(txn.amount)}</td>
        <td>${txn.note || "-"}</td>
        <td><button class="delete-btn" data-id="${txn.id}">🗑️</button></td>
      `;
      tbody.appendChild(tr);
    });

  qsa(".delete-btn").forEach(btn=>{
    btn.onclick = () => {
      state.transactions = state.transactions.filter(t=>t.id!=btn.dataset.id);
      saveState();
      renderTransactions();
    };
  });

  renderMonthlyStats();
}

function renderMonthlyStats() {
  const now = new Date();
  let income = 0, expense = 0;

  state.transactions.forEach(t=>{
    const d = new Date(t.date);
    if (d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear()) {
      t.type==="income" ? income+=t.amount : expense+=t.amount;
    }
  });

  qs("#monthIncome").textContent = formatMoney(income);
  const bal = income-expense;
  qs("#monthBalance").textContent = formatMoney(bal);
  qs("#monthBalance").className = `stat-change ${bal>=0?"positive":"negative"}`;
}

function exportTransactions() {
  let csv = "Date,Type,Category,Amount,Note\n";
  state.transactions.forEach(t=>{
    csv += `${t.date},${t.type},${t.category},${t.amount},"${t.note||""}"\n`;
  });

  const blob = new Blob([csv], {type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "finwise_transactions.csv";
  a.click();
}

/* INITIAL */
renderTransactions();
