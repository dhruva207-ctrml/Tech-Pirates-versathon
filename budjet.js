const COLORS = {
  fixed: "#0B4F9C",
  variable: "#22C55E",
  debt: "#EF4444",
  savings: "#F59E0B"
};

const incomeInput = document.getElementById("income");
const summary = document.getElementById("summary");

incomeInput.addEventListener("input", updateBudget);

function addTask(type) {
  const wrap = document.getElementById(type);

  const task = document.createElement("div");
  task.className = "task";

  task.innerHTML = `
    <input placeholder="Task name">
    <input type="number" placeholder="₹ Amount">
    <div class="bar-bg">
      <div class="bar ${type}"></div>
    </div>
  `;

  task.querySelector('input[type="number"]').addEventListener("input", updateBudget);
  wrap.appendChild(task);
}

function updateBudget() {
  const income = Number(incomeInput.value || 0);
  const totals = { fixed: 0, variable: 0, debt: 0, savings: 0 };

  Object.keys(totals).forEach(type => {
    document
      .querySelectorAll(`#${type} input[type="number"]`)
      .forEach(input => totals[type] += Number(input.value || 0));
  });

  Object.keys(totals).forEach(type => {
    document
      .querySelectorAll(`#${type} .bar`)
      .forEach(bar => {
        bar.style.width = income
          ? Math.min((totals[type] / income) * 100, 100) + "%"
          : "0%";
      });
  });

  const monthly = Object.values(totals).reduce((a, b) => a + b, 0);
  const yearly = monthly * 12;
  const remaining = income - monthly;

  summary.innerHTML = `
    Monthly Expenses: ₹${monthly}<br>
    Projected Yearly: ₹${yearly}<br>
    <span class="${remaining >= 0 ? "green" : "red"}">
      Remaining Balance: ₹${remaining}
    </span>
  `;

  drawPie([
    totals.fixed,
    totals.variable,
    totals.debt,
    totals.savings
  ]);
}

function drawPie(values) {
  const canvas = document.getElementById("pie");
  const ctx = canvas.getContext("2d");

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const outerR = 90;
  const innerR = 55;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const total = values.reduce((a, b) => a + b, 0);

  // Placeholder donut
  if (total === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = outerR - innerR;
    ctx.stroke();
    return;
  }

  let startAngle = -Math.PI / 2;
  const colors = Object.values(COLORS);

  values.forEach((value, index) => {
    if (value <= 0) return;

    const slice = (value / total) * Math.PI * 2;

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
    ctx.arc(cx, cy, innerR, startAngle + slice, startAngle, true);
    ctx.closePath();

    ctx.fillStyle = colors[index];
    ctx.fill();

    startAngle += slice;
  });
}

// Initial render
drawPie([0, 0, 0, 0]);
