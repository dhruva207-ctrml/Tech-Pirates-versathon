const goalsDiv = document.getElementById("goals");
const colors = ["#0B4F9C","#22C55E","#C084FC","#F59E0B","#EF4444","#14B8A6"];
let goals = [];

function addGoal(name = "Laptop") {
    const index = goals.length;
    goals.push({ target: 0, saved: 0, months: 0 });

    const color = colors[index % colors.length];

    goalsDiv.insertAdjacentHTML("beforeend", `
        <div class="goal">
            <div class="goal-row">
                <input class="goal-name" value="${name}">
                <input type="number" placeholder="Target ₹" oninput="updateGoal(${index})">
                <input type="number" placeholder="Saved ₹" oninput="updateGoal(${index})">
                <input type="number" placeholder="Months" oninput="updateGoal(${index})">
                <span id="percent${index}">0%</span>
            </div>

            <div class="progress-bar">
                <div class="progress" id="bar${index}" style="background:${color}"></div>
            </div>

            <div class="small" id="monthly${index}">
                Monthly saving required: ₹0
            </div>
        </div>
    `);
}

function updateGoal(i) {
    const goal = goalsDiv.children[i];
    const inputs = goal.querySelectorAll("input");

    const target = Number(inputs[1].value);
    const saved = Number(inputs[2].value);
    const months = Number(inputs[3].value);

    goals[i] = { target, saved, months };

    // Progress calculation
    const percent = target ? Math.min((saved / target) * 100, 100) : 0;
    document.getElementById("percent" + i).innerText = Math.round(percent) + "%";
    document.getElementById("bar" + i).style.width = percent + "%";

    // Monthly calculation
    const remaining = Math.max(target - saved, 0);
    const monthly = months ? remaining / months : 0;
    document.getElementById("monthly" + i).innerText =
        `Monthly saving required: ₹${monthly.toFixed(0)}`;

    drawPie();
}

function drawPie() {
    const canvas = document.getElementById("pie");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 220, 220);

    const values = goals.map(g => g.target);
    const total = values.reduce((a, b) => a + b, 0);
    let angle = 0;

    values.forEach((v, i) => {
        if (total === 0 || v === 0) return;
        const slice = (v / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(110, 110);
        ctx.arc(110, 110, 100, angle, angle + slice);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        angle += slice;
    });
}

/* DEFAULT GOALS */
addGoal("Laptop");
addGoal("Buy a Car");
