// --- Basic state (localStorage) ---
const STORAGE_KEY = "finguard-data-v1";

const state = {
  transactions: [],
  budget: null,
  tax: null,
  goals: [],
  currency: "₹",
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
  } catch (e) {
    console.error("Failed to load state", e);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// --- Utils ---
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

function formatMoney(amount) {
  return `${state.currency}${Number(amount || 0).toLocaleString("en-IN")}`;
}

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// --- Navigation ---
function initNavigation() {
  const links = qsa(".nav-link");
  links.forEach((btn) => {
    btn.addEventListener("click", () => {
      links.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const target = btn.getAttribute("data-target");
      qsa(".section").forEach((sec) =>
        sec.classList.toggle("active-section", sec.id === target)
      );
      qs("#sectionTitle").textContent =
        target.charAt(0).toUpperCase() + target.slice(1);
    });
  });

  // buttons inside cards that use data-target
  qsa("button[data-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      const link = qs(`.nav-link[data-target="${target}"]`);
      if (link) link.click();
    });
  });
}

// --- Theme toggle ---
function initTheme() {
  const btn = qs("#themeToggle");
  btn.addEventListener("click", () => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    document.documentElement.setAttribute("data-theme", isLight ? "dark" : "light");
    btn.textContent = isLight ? "🌙" : "☀️";
  });
}

// --- Currency select ---
function initCurrency() {
  const select = qs("#currencySelect");
  select.value = state.currency;
  select.addEventListener("change", () => {
    state.currency = select.value;
    saveState();
    renderAll();
  });
}

// --- Transactions ---
function initTransactions() {
  const form = qs("#txnForm");
  qs("#txnDate").value = todayStr();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const type = qs("#txnType").value;
    const category = qs("#txnCategory").value;
    const amount = Number(qs("#txnAmount").value);
    const date = qs("#txnDate").value;
    const note = qs("#txnNote").value.trim();

    if (!amount || amount <= 0) return;

    state.transactions.push({
      id: Date.now(),
      type,
      category,
      amount,
      date,
      note,
    });

    saveState();
    form.reset();
    qs("#txnDate").value = todayStr();
    renderAll();
  });
}

function getMonthYear(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function renderTransactions() {
  const tbody = qs("#txnTableBody");
  tbody.innerHTML = "";
  const lastTen = [...state.transactions].sort((a, b) => b.id - a.id).slice(0, 10);

  lastTen.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="color:${t.type === "income" ? "#4ade80" : "#fb7185"}">
        ${t.type}
      </td>
      <td>${t.category}</td>
      <td>${formatMoney(t.amount)}</td>
      <td>${t.date}</td>
      <td>${t.note || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Dashboard ---
function renderDashboard() {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let income = 0;
  let expense = 0;

  state.transactions.forEach((t) => {
    if (getMonthYear(t.date) !== key) return;
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  });

  qs("#dashIncome").textContent = formatMoney(income);
  qs("#dashExpense").textContent = formatMoney(expense);

  const diff = income - expense;
  const note = diff >= 0
    ? `You are saving ${formatMoney(diff)} this month.`
    : `You are overspending ${formatMoney(Math.abs(diff))} this month.`;
  qs("#dashCashflowNote").textContent =
    income === 0 && expense === 0
      ? "You’re just getting started."
      : note;

  // Simple net worth = cumulative income - expense
  let totalIncome = 0;
  let totalExpense = 0;
  state.transactions.forEach((t) => {
    if (t.type === "income") totalIncome += t.amount;
    else totalExpense += t.amount;
  });
  const net = totalIncome - totalExpense;
  qs("#netWorth").textContent = formatMoney(net);

  // Budget health
  if (!state.budget) {
    qs("#budgetHealth").textContent = "0 % used";
    qs("#budgetBar").style.width = "0%";
    qs("#budgetStatusText").textContent = "Create a monthly budget to see insights.";
  } else {
    const monthKey = state.budget.month;
    let monthlyExpense = 0;
    state.transactions.forEach((t) => {
      if (t.type === "expense" && getMonthYear(t.date) === monthKey) {
        monthlyExpense += t.amount;
      }
    });
    const used = state.budget.total
      ? Math.min(100, Math.round((monthlyExpense / state.budget.total) * 100))
      : 0;
    qs("#budgetHealth").textContent = `${used} % used`;
    qs("#budgetBar").style.width = `${used}%`;
    qs("#budgetStatusText").textContent =
      used > 100
        ? "You exceeded your budget. Consider tightening non‑essential spends."
        : used > 80
        ? "You are close to your budget limit. Monitor carefully."
        : "You are comfortably within your monthly budget.";
  }

  // Tax snapshot
  if (state.tax) {
    qs("#taxEstimate").textContent = formatMoney(state.tax.estimate || 0);
  } else {
    qs("#taxEstimate").textContent = formatMoney(0);
  }
}

// --- Budget ---
function initBudget() {
  const form = qs("#budgetForm");
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  qs("#budgetMonth").value = monthStr;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const month = qs("#budgetMonth").value;
    const total = Number(qs("#budgetTotal").value);
    const essential = Number(qs("#budgetEssential").value || 0);
    const wants = Number(qs("#budgetWants").value || 0);
    const invest = Number(qs("#budgetInvest").value || 0);

    const sum = essential + wants + invest;
    if (sum !== 100) {
      alert("Percentages should add up to 100 for a balanced plan.");
      return;
    }

    state.budget = {
      month,
      total,
      essential,
      wants,
      invest,
    };
    saveState();
    updateBudgetPie();
    renderDashboard();
  });

  updateBudgetPie();
}

function updateBudgetPie() {
  const pie = qs(".budget-pie");
  if (!state.budget) {
    pie.style.background =
      "conic-gradient(#22c55e 0 180deg, #f97316 180deg 288deg, #4f46e5 288deg 360deg)";
    qs("#budgetHint").textContent =
      "Aim for at least 20% towards investments to grow wealth.";
    return;
  }
  const { essential, wants, invest } = state.budget;
  const eAngle = (essential / 100) * 360;
  const wAngle = (wants / 100) * 360 + eAngle;
  const iAngle = 360;

  pie.style.background = `conic-gradient(
      #22c55e 0 ${eAngle}deg,
      #f97316 ${eAngle}deg ${wAngle}deg,
      #4f46e5 ${wAngle}deg ${iAngle}deg
    )`;

  qs("#budgetHint").textContent =
    invest < 20
      ? "You are investing less than 20%. Try increasing it for faster goal achievement."
      : "Nice! Your investing allocation looks healthy.";
}

// --- Tax planner (very simplified for demo, not accurate) ---
function initTax() {
  const form = qs("#taxForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const income = Number(qs("#taxIncome").value);
    const eightyC = Math.min(Number(qs("#tax80C").value || 0), 150000);
    const eightyD = Number(qs("#tax80D").value || 0);
    const regime = qs("#taxRegime").value;

    let taxable = income;
    if (regime === "old") {
      const standardDeduction = 50000;
      taxable = Math.max(0, income - standardDeduction - eightyC - eightyD);
    } else {
      // simplified: only standard deduction
      const sd = 50000;
      taxable = Math.max(0, income - sd);
    }

    // simple slab: 0-3L:0, 3-6L:5%, 6-9L:10%, 9-12L:15%, 12-15L:20%, >15L:30%
    const tax = estimateTaxIndia(taxable);

    state.tax = {
      income,
      taxable,
      regime,
      estimate: tax,
    };
    saveState();
    renderTaxTips(income, taxable, regime, eightyC, eightyD, tax);
    renderDashboard();
  });
}

function estimateTaxIndia(taxable) {
  
  // Up to ₹4L: 0% ✓
  if (taxable <= 400000) return 0;
  
  // ₹4L - ₹8L: 5%
  if (taxable <= 800000) {
    return Math.round((taxable - 400000) * 0.05);
  }
  
  // ₹8L - ₹12L: 5% + 10% = ₹20,000 + 10% above ₹8L
  if (taxable <= 1200000) {
    return Math.round(20000 + (taxable - 800000) * 0.10);
  }
  
  // Above ₹12L: Add progressive slabs (simplified for demo)
  let tax = 60000; // Up to ₹12L tax
  tax += Math.round((taxable - 1200000) * 0.15);
  return Math.round(tax);
}

function renderTaxTips(income, taxable, regime, e80C, e80D, tax) {
  qs("#taxOut").textContent = formatMoney(tax);
  
  // NEW REGIME: No deductions except ₹75k standard
  const newTaxable = Math.max(0, income - 75000);
  const oldTaxable = Math.max(0, income - 50000 - Math.min(e80C, 150000) - Math.min(e80D, 25000));
  
  const oldTax = estimateTaxIndia(oldTaxable);
  const newTax = estimateTaxIndia(newTaxable);
  
  const betterRegime = oldTax < newTax ? 'old' : 'new';
  const savings = Math.abs(oldTax - newTax);
  
  qs("#regimeComparison").innerHTML = `
    <div class="regime-row">
      <span class="regime-label">Old Regime:</span>
      <span class="regime-value ${betterRegime === 'old' ? 'highlight' : ''}">${formatMoney(oldTax)}</span>
    </div>
    <div class="regime-row">
      <span class="regime-label">New Regime:</span>
      <span class="regime-value ${betterRegime === 'new' ? 'highlight' : ''}">${formatMoney(newTax)}</span>
    </div>
    <div class="regime-savings">
      ✅ ${betterRegime.toUpperCase()} saves ${formatMoney(savings)} vs other regime
    </div>
  `;
  
  // CORRECT message
  qs("#taxMessage").textContent = 
    income <= 750000 ? "✅ Tax-free under new regime (up to ₹7.5L after std deduction)!" :
    `Your ${regime} regime tax: ${((tax/(income||1))*100).toFixed(1)}%`;

}
// --- Goals ---
function initGoals() {
  const form = qs("#goalForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = qs("#goalName").value.trim();
    const target = Number(qs("#goalTarget").value);
    const date = qs("#goalDate").value;
    const saved = Number(qs("#goalSaved").value || 0);

    if (!name || !target || !date) return;

    // if same name exists, update
    const existing = state.goals.find((g) => g.name === name);
    if (existing) {
      existing.target = target;
      existing.date = date;
      existing.saved = saved;
    } else {
      state.goals.push({
        id: Date.now(),
        name,
        target,
        date,
        saved,
      });
    }

    saveState();
    renderGoals();
  });

  renderGoals();
}

function monthsBetween(start, end) {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const years = d2.getFullYear() - d1.getFullYear();
  const months = d2.getMonth() - d1.getMonth();
  const total = years * 12 + months;
  return total <= 0 ? 1 : total;
}

function renderGoals() {
  const tbody = qs("#goalTableBody");
  tbody.innerHTML = "";
  const today = todayStr();

  state.goals.forEach((g) => {
    const monthsLeft = monthsBetween(today, g.date);
    const remaining = Math.max(0, g.target - g.saved);
    const perMonth = Math.ceil(remaining / monthsLeft);
    const progress = Math.min(100, Math.round((g.saved / g.target) * 100));
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${g.name}</td>
      <td>${formatMoney(g.target)}</td>
      <td>${formatMoney(g.saved)}</td>
      <td>${progress} %</td>
      <td>${formatMoney(perMonth)}/month</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Analytics (simple canvas bar chart) ---
function renderAnalytics() {
  const canvas = qs("#categoryChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const nowKey = getMonthYear(todayStr());
  const sums = {};
  state.transactions.forEach((t) => {
    if (t.type !== "expense") return;
    if (getMonthYear(t.date) !== nowKey) return;
    sums[t.category] = (sums[t.category] || 0) + t.amount;
  });

  const categories = Object.keys(sums);
  if (!categories.length) {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "12px system-ui";
    ctx.fillText("No expense data for this month.", 20, 40);
    return;
  }

  const values = categories.map((c) => sums[c]);
  const max = Math.max(...values);

  const padding = 40;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;
  const barWidth = chartWidth / categories.length - 10;

  ctx.font = "11px system-ui";
  ctx.textAlign = "center";

  categories.forEach((cat, i) => {
    const x = padding + i * (barWidth + 10);
    const height = (sums[cat] / max) * chartHeight;
    const y = canvas.height - padding - height;

    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, "#22c55e");
    gradient.addColorStop(1, "#4f46e5");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, height);

    ctx.fillStyle = "#9ca3af";
    ctx.fillText(cat, x + barWidth / 2, canvas.height - padding + 14);
  });
}

// --- Insights (very simple rules) ---
function renderInsights() {
  const ul = qs("#insightsList");
  ul.innerHTML = "";

  const nowKey = getMonthYear(todayStr());
  let income = 0;
  let expense = 0;
  const byCategory = {};
  state.transactions.forEach((t) => {
    if (getMonthYear(t.date) !== nowKey) return;
    if (t.type === "income") income += t.amount;
    else {
      expense += t.amount;
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    }
  });

  if (income === 0 && expense === 0) {
    ul.innerHTML = "<li>Add a few transactions to unlock insights.</li>";
    return;
  }

  const tips = [];
  if (income > 0) {
    const rate = ((expense / income) * 100).toFixed(1);
    tips.push(`Your savings rate this month is approximately ${(100 - rate).toFixed(1)} %.`);
  }

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    tips.push(
      `Your highest spending category is "${topCategory[0]}" at ${formatMoney(
        topCategory[1]
      )}. Try setting a cap here next month.`
    );
  }

  if (state.budget && state.budget.invest >= 20) {
    tips.push("Your budget dedicates at least 20% to investments. This supports long‑term goals.");
  }

  if (state.goals.length) {
    const urgent = state.goals
      .map((g) => ({
        ...g,
        monthsLeft: monthsBetween(todayStr(), g.date),
      }))
      .sort((a, b) => a.monthsLeft - b.monthsLeft)[0];
    if (urgent) {
      tips.push(
        `Goal "${urgent.name}" is nearest. You need around ${formatMoney(
          Math.ceil((urgent.target - urgent.saved) / urgent.monthsLeft)
        )} per month to hit the deadline.`
      );
    }
  }

  tips.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t;
    ul.appendChild(li);
  });
}

// --- Export backup ---
function initExport() {
  qs("#exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finguard-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  });
}

// --- Init ---
function renderAll() {
  renderTransactions();
  renderDashboard();
  updateBudgetPie();
  renderGoals();
  renderAnalytics();
  renderInsights();
}

window.addEventListener("DOMContentLoaded", () => {
  loadState();
  initNavigation();
  initTheme();
  initCurrency();
  initTransactions();
  initBudget();
  initTax();
  initGoals();
  initExport();

  qs("#refreshInsights").addEventListener("click", renderInsights);

  renderAll();
 } );
