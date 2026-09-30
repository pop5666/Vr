const CATEGORIES = [
    {
        name: "สัตว์โลกน่ารัก",
        themes: ['#2d5a27', '#8b5a2b', '#1e3d59', '#3b6978', '#204051', '#4b6584']
    },
    {
        name: "สถานที่ท่องเที่ยว",
        themes: ['#2c3e50', '#d35400', '#2980b9', '#8e44ad', '#16a085', '#7f8c8d']
    },
    {
        name: "ร้านอาหาร & เมนูอร่อย",
        themes: ['#c0392b', '#d35400', '#f39c12', '#27ae60', '#e67e22', '#6d214f']
    }
];

let state = {
    catIndex: 0,
    levelIndex: 0,
    lives: 3,
    timeLeft: 90,
    foundCount: 0,
    hintsLeft: 3,
    differences: [],
    timer: null
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    const btnPlay = document.getElementById('btn-play');
    const btnHow = document.getElementById('btn-how');
    const mapBack = document.getElementById('map-back');
    const btnPause = document.getElementById('btn-pause');
    const catBtns = document.querySelectorAll('.btn-cat');

    catBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            catBtns.forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            state.catIndex = parseInt(target.dataset.cat) || 0;
        });
    });

    if (btnPlay) {
        btnPlay.addEventListener('click', () => {
            renderLevelGrid();
            switchScreen('screen-map');
        });
    }

    if (mapBack) {
        mapBack.addEventListener('click', () => switchScreen('screen-home'));
    }

    if (btnPause) {
        btnPause.addEventListener('click', () => {
            clearInterval(state.timer);
            showModal("พักเกม", "ต้องการกลับไปหน้าเลือกด่านหรือไม่?", [
                { text: "เล่นต่อ", action: () => startTimer() },
                { text: "เลือกด่าน", action: () => switchScreen('screen-map') }
            ]);
        });
    }

    if (btnHow) {
        btnHow.addEventListener('click', () => {
            showModal("วิธีเล่น", "เปรียบเทียบภาพสองภาพ แล้วแตะจุดที่แตกต่างกันให้ครบ 3 จุดก่อนเวลาจะหมด!", [
                { text: "เข้าใจแล้ว", action: () => {} }
            ]);
        });
    }

    const canvasLeft = document.getElementById('canvas-left');
    const canvasRight = document.getElementById('canvas-right');

    [canvasLeft, canvasRight].forEach(canvas => {
        if (canvas) {
            canvas.addEventListener('click', (e) => {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;

                const clickX = (e.clientX - rect.left) * scaleX;
                const clickY = (e.clientY - rect.top) * scaleY;

                checkClick(clickX, clickY);
            });
        }
    });
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

function renderLevelGrid() {
    const grid = document.getElementById('level-grid');
    const mapTitle = document.getElementById('map-title');
    if (!grid) return;

    grid.innerHTML = '';
    if (mapTitle) {
        mapTitle.textContent = CATEGORIES[state.catIndex].name;
    }

    for (let i = 0; i < 20; i++) {
        const card = document.createElement('div');
        card.className = 'lvl-card';
        card.innerHTML = `
            <div class="lvl-num">${i + 1}</div>
            <div class="lvl-stars">
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
            </div>
        `;
        card.addEventListener('click', () => startLevel(i));
        grid.appendChild(card);
    }
}

function startLevel(lvlIdx) {
    state.levelIndex = lvlIdx;
    state.lives = 3;
    state.timeLeft = 90;
    state.foundCount = 0;
    state.hintsLeft = 3;
    updateHUD();

    switchScreen('screen-game');
    generateDetailedScene();
    startTimer();
}

function updateHUD() {
    const timeElem = document.getElementById('time-left');
    const foundElem = document.getElementById('found-count');
    const hintElem = document.getElementById('hint-count');

    if (timeElem) timeElem.textContent = state.timeLeft;
    if (foundElem) foundElem.textContent = state.foundCount;
    if (hintElem) hintElem.textContent = state.hintsLeft;
    
    const hearts = document.querySelectorAll('#hearts-container i');
    hearts.forEach((h, i) => {
        if (i < state.lives) h.classList.add('active');
        else h.classList.remove('active');
    });
}

function generateDetailedScene() {
    const canvasLeft = document.getElementById('canvas-left');
    const canvasRight = document.getElementById('canvas-right');
    if (!canvasLeft || !canvasRight) return;

    const ctxLeft = canvasLeft.getContext('2d');
    const ctxRight = canvasRight.getContext('2d');

    const width = 600;
    const height = 450;

    canvasLeft.width = width;
    canvasLeft.height = height;
    canvasRight.width = width;
    canvasRight.height = height;

    const themeColors = CATEGORIES[state.catIndex].themes;
    const baseColor = themeColors[state.levelIndex % themeColors.length];

    [ctxLeft, ctxRight].forEach(ctx => {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, baseColor);
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + (i % 4) * 0.02})`;
            ctx.beginPath();
            ctx.arc((i * 83) % width, (i * 47) % height, (i * 11) % 50 + 10, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    state.differences = [];
    for (let i = 0; i < 3; i++) {
        const cx = Math.floor(100 + Math.random() * (width - 200));
        const cy = Math.floor(80 + Math.random() * (height - 160));
        const r = 20;

        drawStar(ctxLeft, cx, cy, 5, r, r/2, '#f59e0b');

        state.differences.push({ x: cx, y: cy, r: r, found: false });
    }
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function startTimer() {
    clearInterval(state.timer);
    state.timer = setInterval(() => {
        state.timeLeft--;
        const timeElem = document.getElementById('time-left');
        if (timeElem) timeElem.textContent = state.timeLeft;

        if (state.timeLeft <= 0) {
            clearInterval(state.timer);
            showModal("หมดเวลา!", "หมดเวลาแล้ว ลองใหม่อีกครั้งครับ", [
                { text: "ลองใหม่", action: () => startLevel(state.levelIndex) }
            ]);
        }
    }, 1000);
}

function checkClick(x, y) {
    let hit = false;
    state.differences.forEach(diff => {
        if (!diff.found) {
            const dist = Math.hypot(diff.x - x, diff.y - y);
            if (dist <= diff.r * 2) {
                diff.found = true;
                hit = true;
                state.foundCount++;
                drawFoundCircle(diff.x, diff.y, diff.r);
                updateHUD();

                if (state.foundCount >= 3) {
                    clearInterval(state.timer);
                    showModal("ผ่านด่านแล้ว!", "ยอดเยี่ยมมาก คุณหาจุดต่างได้ครบถ้วน", [
                        { text: "ด่านถัดไป", action: () => startLevel((state.levelIndex + 1) % 20) }
                    ]);
                }
            }
        }
    });

    if (!hit) {
        state.lives--;
        updateHUD();
        if (state.lives <= 0) {
            clearInterval(state.timer);
            showModal("เกมโอเวอร์", "คุณใช้หัวใจหมดแล้ว!", [
                { text: "ลองใหม่", action: () => startLevel(state.levelIndex) }
            ]);
        }
    }
}

function drawFoundCircle(x, y, r) {
    const canvasLeft = document.getElementById('canvas-left');
    const canvasRight = document.getElementById('canvas-right');
    if (!canvasLeft || !canvasRight) return;

    [canvasLeft.getContext('2d'), canvasRight.getContext('2d')].forEach(ctx => {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, r + 5, 0, Math.PI * 2);
        ctx.stroke();
    });
}

function showModal(title, body, actions) {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const actContainer = document.getElementById('modal-actions');
    const modalOverlay = document.getElementById('modal-overlay');

    if (modalTitle) modalTitle.textContent = title;
    if (modalBody) modalBody.textContent = body;
    if (actContainer) {
        actContainer.innerHTML = '';
        actions.forEach(act => {
            const btn = document.createElement('button');
            btn.className = 'btn-primary-large';
            btn.textContent = act.text;
            btn.onclick = () => {
                if (modalOverlay) modalOverlay.classList.remove('active');
                act.action();
            };
            actContainer.appendChild(btn);
        });
    }

    if (modalOverlay) modalOverlay.classList.add('active');
}
