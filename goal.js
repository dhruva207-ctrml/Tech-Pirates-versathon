const goalsDiv = document.getElementById("goals");
const colors = ["#0B4F9C", "#22C55E", "#C084FC", "#F59E0B", "#EF4444", "#14B8A6"];
let goals = [];

// Modal Logic
const modal = document.getElementById("goalModal");
const iconOptions = document.querySelectorAll(".icon-option");
const colorOptions = document.querySelectorAll(".color-option");

// Bind click events for selectors
if (iconOptions) {
    iconOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            iconOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
        });
    });
}

if (colorOptions) {
    colorOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            colorOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
        });
    });
}

// Override standard addGoal to strictly open modal
function addGoal() {
    modal.style.display = "block";
    // Set default date to today or empty
    const dateInput = document.getElementById('newGoalDate');
    if (dateInput) dateInput.valueAsDate = new Date();
}

function closeModal() {
    modal.style.display = "none";
}

// Close when clicking outside
window.onclick = function (event) {
    if (event.target == modal) {
        closeModal();
    }
}

function saveNewGoal() {
    const name = document.getElementById("newGoalName").value || "New Goal";
    const target = parseFloat(document.getElementById("newGoalTarget").value) || 0;
    const saved = parseFloat(document.getElementById("newGoalSaved").value) || 0;
    const dateStr = document.getElementById("newGoalDate").value;

    // Get Selected Icon
    let iconClass = "fas fa-piggy-bank";
    const selectedIcon = document.querySelector(".icon-option.selected");
    if (selectedIcon) iconClass = selectedIcon.getAttribute("data-icon");

    // Get Selected Color
    let color = "#22C55E";
    const selectedColor = document.querySelector(".color-option.selected");
    if (selectedColor) color = selectedColor.getAttribute("data-color");

    // Calculate months
    let months = 0;
    if (dateStr) {
        const today = new Date();
        const targetDate = new Date(dateStr);
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        months = Math.max(0, diffDays / 30);
    }

    createGoal(name, target, saved, months, color, iconClass);
    closeModal();

    // Reset form
    document.getElementById("newGoalName").value = "";
    document.getElementById("newGoalTarget").value = "";
    document.getElementById("newGoalSaved").value = "";
    document.getElementById("newGoalNotes").value = "";
}

function createGoal(name, target, saved, months, color, iconClass) {
    const index = goals.length;
    goals.push({ target, saved, months });

    // Use a slightly different layout to accommodate icon and color
    goalsDiv.insertAdjacentHTML("beforeend", `
        <div class="goal" id="goal-${index}">
            <div class="goal-header" style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                <div style="width:40px; height:40px; background:${color}20; border-radius:10px; display:flex; align-items:center; justify-content:center; color:${color}; font-size:18px;">
                    <i class="${iconClass}"></i>
                </div>
                <div>
                    <h3 style="margin:0; font-size:16px; color:#1e293b;">${name}</h3>
                    <div style="font-size:11px; color:#64748b;">Target: ₹${target.toLocaleString()}</div>
                </div>
            </div>
            
            <div class="goal-row">
                <!-- Hidden name input to maintain index structure if needed, or just rely on inputs order -->
                <input type="hidden" class="goal-name" value="${name}"> 
                
                <div class="input-wrapper">
                     <input type="number" value="${target}" oninput="updateGoal(${index})" placeholder="Target">
                </div>
                <div class="input-wrapper">
                     <input type="number" value="${saved}" oninput="updateGoal(${index})" placeholder="Saved">
                </div>
                 <div class="input-wrapper">
                     <input type="number" value="${months.toFixed(1)}" oninput="updateGoal(${index})" placeholder="Months">
                </div>
                <span id="percent${index}" style="font-weight:bold; color:${color}; font-size:14px;">0%</span>
            </div>

            <div class="progress-bar">
                <div class="progress" id="bar${index}" style="background:${color}; width:0%"></div>
            </div>

            <div class="small" id="monthly${index}">
                Monthly saving required: ₹0
            </div>
        </div>
    `);

    // Trigger update to calculate initial values
    // Save to localStorage
    saveGoalsToStorage();
}

function updateGoal(i) {
    const goalEl = document.getElementById(`goal-${i}`);
    if (!goalEl) return;

    const inputs = goalEl.querySelectorAll("input[type=number]"); // Get number inputs only
    // inputs[0] is target, inputs[1] is saved, inputs[2] is months

    // We also need to get the name, color, and icon to save them correctly
    // The name is in a hidden input
    const nameInput = goalEl.querySelector(".goal-name");
    const name = nameInput ? nameInput.value : "Goal";

    // Since we don't store color/icon in inputs, we need to retrieve them from the existing goals array or the DOM
    // Retrieving from checking current goals array state before overwrite
    const existingGoal = goals[i] || {};
    const color = existingGoal.color || "#0B4F9C";
    const iconClass = existingGoal.iconClass || "fas fa-piggy-bank";

    const target = Number(inputs[0].value);
    const saved = Number(inputs[1].value);
    const months = Number(inputs[2].value);

    goals[i] = { name, target, saved, months, color, iconClass };

    // Progress calculation
    const percent = target ? Math.min((saved / target) * 100, 100) : 0;
    const percentEl = document.getElementById("percent" + i);
    const barEl = document.getElementById("bar" + i);

    if (percentEl) percentEl.innerText = Math.round(percent) + "%";
    if (barEl) barEl.style.width = percent + "%";

    // Monthly calculation
    const remaining = Math.max(target - saved, 0);
    const monthly = months > 0 ? remaining / months : 0;

    const monthlyEl = document.getElementById("monthly" + i);
    if (monthlyEl) {
        monthlyEl.innerText = `Monthly saving required: ₹${Math.round(monthly).toLocaleString()}`;
    }

    drawPie();
    saveGoalsToStorage();
}

function saveGoalsToStorage() {
    localStorage.setItem('finwise_goals', JSON.stringify(goals));
}

function loadGoalsFromStorage() {
    const storedGoals = localStorage.getItem('finwise_goals');
    if (storedGoals) {
        const parsedGoals = JSON.parse(storedGoals);
        parsedGoals.forEach(g => {
            createGoal(g.name, g.target, g.saved, g.months, g.color, g.iconClass);
        });
    } else {
        // Default goals if nothing in storage
        createGoal("Laptop", 80000, 20000, 6, "#0B4F9C", "fas fa-laptop");
        createGoal("Buy a Car", 1500000, 500000, 24, "#22C55E", "fas fa-car");
    }
}

function createGoal(name, target, saved, months, color, iconClass) {
    const index = goals.length;
    // We push to array here, but updateGoal will overwrite it with full details including DOM readings
    // Actually, distinct push here is fine, but updateGoal reads back from DOM which can be tricky if not synced.
    // Better to have a consistent single source of truth.
    // However, following existing pattern:
    goals.push({ name, target, saved, months, color, iconClass });

    // Use a slightly different layout to accommodate icon and color
    goalsDiv.insertAdjacentHTML("beforeend", `
        <div class="goal" id="goal-${index}">
            <div class="goal-header" style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                <div style="width:40px; height:40px; background:${color}20; border-radius:10px; display:flex; align-items:center; justify-content:center; color:${color}; font-size:18px;">
                    <i class="${iconClass}"></i>
                </div>
                <div>
                    <h3 style="margin:0; font-size:16px; color:#1e293b;">${name}</h3>
                    <div style="font-size:11px; color:#64748b;">Target: ₹${target.toLocaleString()}</div>
                </div>
            </div>
            
            <div class="goal-row">
                <!-- Hidden name input to maintain name persistence -->
                <input type="hidden" class="goal-name" value="${name}"> 
                
                <div class="input-wrapper">
                     <input type="number" value="${target}" oninput="updateGoal(${index})" placeholder="Target">
                </div>
                <div class="input-wrapper">
                     <input type="number" value="${saved}" oninput="updateGoal(${index})" placeholder="Saved">
                </div>
                 <div class="input-wrapper">
                     <input type="number" value="${months}" oninput="updateGoal(${index})" placeholder="Months">
                </div>
                <span id="percent${index}" style="font-weight:bold; color:${color}; font-size:14px;">0%</span>
            </div>

            <div class="progress-bar">
                <div class="progress" id="bar${index}" style="background:${color}; width:0%"></div>
            </div>

            <div class="small" id="monthly${index}">
                Monthly saving required: ₹0
            </div>
        </div>
    `);

    // Trigger update to calculate initial values like percentages
    // But we need to be careful not to trigger saveGoalsToStorage inside updateGoal immediately if we are loading
    // from storage, otherwise we might write partial data. 
    // Actually, updateGoal reads inputs from DOM. DOM is just set. So it should be fine.

    // Explicitly call update visual logic without rewriting to array if possible, OR just normal update
    // Let's rely on normal update for simplicity, it writes to storage again which is redundant but safe.
    updateGoal(index);
}

function drawPie() {
    const canvas = document.getElementById("pie");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 220, 220);

    const values = goals.map(g => g.target);
    const total = values.reduce((a, b) => a + b, 0);
    let angle = -0.5 * Math.PI; // Start at top

    if (total === 0) {
        // Draw empty gray circle
        ctx.beginPath();
        ctx.arc(110, 110, 100, 0, 2 * Math.PI);
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 20;
        ctx.stroke();
        return;
    }

    values.forEach((v, i) => {
        if (v === 0) return;
        const slice = (v / total) * 2 * Math.PI;

        ctx.beginPath();
        ctx.moveTo(110, 110);
        ctx.arc(110, 110, 100, angle, angle + slice);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();

        // Add white border between slices
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();

        angle += slice;
    });

    // Cut out inner circle for donut chart look (optional, but looks better)
    ctx.beginPath();
    ctx.arc(110, 110, 60, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fill();
}

// Initialize
loadGoalsFromStorage();
