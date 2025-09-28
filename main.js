// Simple pathfinding visualizer (vanilla JS). Single-file for quick testing and extension.
// Config
const ROWS = 22; // default grid size (user can change in code)
const COLS = 36;
let cellSize = 24;
let mode = "draw"; // draw | start | end
let isMouseDown = false;
let showWeights = false;
let movingObstacles = false;
let movingInterval = null;

// Grid data
const grid = [];
let start = {
	r: 2,
	c: 2,
};
let end = {
	r: ROWS - 3,
	c: COLS - 3,
};

// DOM
const gridContainer = document.getElementById("gridContainer");
const visitedCountEl = document.getElementById("visitedCount");
const pathLenEl = document.getElementById("pathLen");
const pathCostEl = document.getElementById("pathCost");

function makeGrid(rows, cols) {
	gridContainer.innerHTML = "";
	const wrapper = document.createElement("div");
	wrapper.className = "grid";
	wrapper.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
	wrapper.style.width = cols * (cellSize + 1) + "px";
	wrapper.style.height = rows * (cellSize + 1) + "px";
	for (let r = 0; r < rows; r++) {
		grid[r] = [];
		for (let c = 0; c < cols; c++) {
			const el = document.createElement("div");
			el.className = "cell empty";
			el.dataset.r = r;
			el.dataset.c = c;
			el.dataset.weight = "1";
			el.innerHTML = '<div class="overlay"></div>';
			wrapper.appendChild(el);
			grid[r][c] = {
				el,
				r,
				c,
				obs: false,
				weight: 1,
			};
		}
	}
	gridContainer.appendChild(wrapper);
}

makeGrid(ROWS, COLS);
renderSpecials();

// UI bindings
document.getElementById("drawObstacle").onclick = () => (mode = "draw");
document.getElementById("setStart").onclick = () => (mode = "start");
document.getElementById("setEnd").onclick = () => (mode = "end");

document.getElementById("clearObsBtn").onclick = () => {
	for (let r = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++) {
			grid[r][c].obs = false;
			grid[r][c].weight = 1;
			grid[r][c].el.className = "cell empty";
			grid[r][c].el.querySelector(".overlay").textContent = "";
		}
	renderSpecials();
};

// toggle weight types
document.getElementById("toggleWeights").onclick = () => {
	showWeights = !showWeights;
	applyRandomWeights();
};

function applyRandomWeights() {
	for (let r = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++) {
			if (grid[r][c].obs) continue;
			const p = Math.random();
			if (showWeights) {
				if (p < 0.09) {
					grid[r][c].weight = 5;
					grid[r][c].el.classList.add("weight-5");
				} else if (p < 0.25) {
					grid[r][c].weight = 2;
					grid[r][c].el.classList.add("weight-2");
				} else {
					grid[r][c].weight = 1;
					grid[r][c].el.classList.remove("weight-2", "weight-5");
				}
			} else {
				grid[r][c].weight = 1;
				grid[r][c].el.classList.remove("weight-2", "weight-5");
			}
			updateCellOverlay(grid[r][c]);
		}
}

function updateCellOverlay(cell) {
	const ov = cell.el.querySelector(".overlay");
	ov.textContent = cell.weight > 1 ? cell.weight : "";
}

// mouse events
gridContainer.addEventListener("mousedown", (e) => {
	isMouseDown = true;
	handleCellEvent(e);
});
gridContainer.addEventListener("mouseup", (e) => {
	isMouseDown = false;
});
gridContainer.addEventListener("mouseleave", (e) => {
	isMouseDown = false;
});
gridContainer.addEventListener("mousemove", (e) => {
	if (isMouseDown) handleCellEvent(e);
});
gridContainer.addEventListener("click", (e) => {
	handleCellEvent(e);
});

function handleCellEvent(e) {
	const cellEl = e.target.closest(".cell");
	if (!cellEl) return;
	const r = +cellEl.dataset.r,
		c = +cellEl.dataset.c;
	if (mode === "draw") {
		grid[r][c].obs = !grid[r][c].obs;
		cellEl.className = grid[r][c].obs ? "cell obstacle" : "cell empty";
		grid[r][c].weight = grid[r][c].obs ? 9999 : grid[r][c].weight;
		updateCellOverlay(grid[r][c]);
	} else if (mode === "start") {
		start = {
			r,
			c,
		};
		renderSpecials();
	} else if (mode === "end") {
		end = {
			r,
			c,
		};
		renderSpecials();
	}
}

function renderSpecials() {
	for (let r = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++) {
			const cell = grid[r][c];
			if (cell.obs) continue;
			cell.el.classList.remove("start", "end", "path", "open", "closed");
			cell.el.classList.add("empty");
			updateCellOverlay(cell);
		}
	grid[start.r][start.c].el.classList.add("start");
	grid[end.r][end.c].el.classList.add("end");
}

// Random map
document.getElementById("randomMap").onclick = () => {
	for (let r = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++) {
			if (Math.random() < 0.2) {
				grid[r][c].obs = true;
				grid[r][c].el.className = "cell obstacle";
				grid[r][c].weight = 9999;
			} else {
				grid[r][c].obs = false;
				grid[r][c].el.className = "cell empty";
				grid[r][c].weight = 1;
			}
		}
	renderSpecials();
};

// Save / Load
document.getElementById("saveMap").onclick = () => {
	const data = {
		rows: ROWS,
		cols: COLS,
		start,
		end,
		cells: [],
	};
	for (let r = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++)
			data.cells.push({
				r,
				c,
				obs: grid[r][c].obs,
				weight: grid[r][c].weight,
			});
	localStorage.setItem("pf_map", JSON.stringify(data));
	alert("Saved to localStorage");
};
document.getElementById("loadMap").onclick = () => {
	const data = JSON.parse(localStorage.getItem("pf_map") || "null");
	if (!data) return alert("No map saved");
	data.cells.forEach((obj) => {
		grid[obj.r][obj.c].obs = obj.obs;
		grid[obj.r][obj.c].weight = obj.weight;
		grid[obj.r][obj.c].el.className = obj.obs
			? "cell obstacle"
			: "cell empty";
		updateCellOverlay(grid[obj.r][obj.c]);
	});
	start = data.start;
	end = data.end;
	renderSpecials();
};

// Moving obstacles (simple oscillation)
document.getElementById("movingObs").onclick = () => {
	movingObstacles = !movingObstacles;
	if (movingObstacles) startMovingObstacles();
	else stopMovingObstacles();
};
let mobPositions = [];

function startMovingObstacles() {
	// pick some free cells
	mobPositions = [];
	for (let i = 0; i < 8; i++) {
		let r = Math.floor(Math.random() * (ROWS - 2)) + 1;
		let c = Math.floor(Math.random() * (COLS - 2)) + 1;
		if (
			!grid[r][c].obs &&
			!(r === start.r && c === start.c) &&
			!(r === end.r && c === end.c)
		) {
			grid[r][c].obs = true;
			grid[r][c].el.className = "cell obstacle";
			mobPositions.push({
				r,
				c,
				dir: Math.random() < 0.5 ? 1 : -1,
			});
		}
	}
	movingInterval = setInterval(() => {
		// move each obstacle horizontally
		mobPositions.forEach((m) => {
			grid[m.r][m.c].obs = false;
			grid[m.r][m.c].el.className = "cell empty";
			const nc = m.c + m.dir;
			if (
				nc <= 1 ||
				nc >= COLS - 2 ||
				grid[m.r][nc].el.classList.contains("start") ||
				grid[m.r][nc].el.classList.contains("end")
			)
				m.dir *= -1;
			else {
				m.c = nc;
			}
		});
		mobPositions.forEach((m) => {
			grid[m.r][m.c].obs = true;
			grid[m.r][m.c].el.className = "cell obstacle";
		});
	}, 600);
}

function stopMovingObstacles() {
	clearInterval(movingInterval);
	movingInterval = null;
}

// Algorithms
function neighbors(r, c) {
	return [
		{
			r: r - 1,
			c,
		},
		{
			r: r + 1,
			c,
		},
		{
			r,
			c: c - 1,
		},
		{
			r,
			c: c + 1,
		},
	].filter((n) => n.r >= 0 && n.r < ROWS && n.c >= 0 && n.c < COLS);
}

function neigh8(r, c) {
	const arr = [];
	for (let dr = -1; dr <= 1; dr++)
		for (let dc = -1; dc <= 1; dc++)
			if (!(dr === 0 && dc === 0))
				arr.push({
					r: r + dr,
					c: c + dc,
				});
	return arr.filter((n) => n.r >= 0 && n.r < ROWS && n.c >= 0 && n.c < COLS);
}

function heuristicFn(type) {
	if (type === "manhattan")
		return (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
	if (type === "euclidean") return (a, b) => Math.hypot(a.r - b.r, a.c - b.c);
	return (a, b) => Math.max(Math.abs(a.r - b.r), Math.abs(a.c - b.c));
}

// Priority Queue (min-heap) simple implementation using array
class PQ {
	constructor() {
		this.data = [];
	}
	push(item, priority) {
		this.data.push({
			item,
			priority,
		});
		this.data.sort((a, b) => a.priority - b.priority);
	}
	pop() {
		return this.data.shift()?.item;
	}
	empty() {
		return this.data.length === 0;
	}
}

let runState = {
	running: false,
	paused: false,
};

async function runAlgorithm() {
	runState.running = true;
	runState.paused = false;
	const algo = document.getElementById("algoSelect").value;
	const heur = document.getElementById("heuristic").value;
	for (let r = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++) {
			grid[r][c].el.classList.remove("open", "closed", "path");
		}
	visitedCountEl.textContent = "0";
	pathLenEl.textContent = "0";
	pathCostEl.textContent = "0";

	if (algo === "bfs") await bfs();
	else if (algo === "dijkstra") await dijkstra();
	else await astar(heur);
	runState.running = false;
}

function sleep(ms) {
	return new Promise((res) => setTimeout(res, ms));
}

async function bfs() {
	const q = [];
	const prev = Array.from(
		{
			length: ROWS,
		},
		() => Array(COLS).fill(null)
	);
	const visited = Array.from(
		{
			length: ROWS,
		},
		() => Array(COLS).fill(false)
	);
	q.push(start);
	visited[start.r][start.c] = true;
	let visitedCount = 0;
	while (q.length && !runState.paused) {
		const cur = q.shift();
		const el = grid[cur.r][cur.c];
		if (
			!(cur.r === start.r && cur.c === start.c) &&
			!(cur.r === end.r && cur.c === end.c)
		)
			el.classList.add("closed");
		visitedCount++;
		visitedCountEl.textContent = visitedCount;
		if (cur.r === end.r && cur.c === end.c) {
			reconstruct(prev);
			return;
		}
		for (const n of neighbors(cur.r, cur.c)) {
			if (visited[n.r][n.c]) continue;
			if (grid[n.r][n.c].obs) continue;
			visited[n.r][n.c] = true;
			prev[n.r][n.c] = cur;
			q.push(n);
			if (!(n.r === end.r && n.c === end.c))
				grid[n.r][n.c].el.classList.add("open");
		}
		const delay = 200 - +document.getElementById("speedRange").value;
		await sleep(delay);
	}
}

async function dijkstra() {
	const dist = Array.from(
		{
			length: ROWS,
		},
		() => Array(COLS).fill(Infinity)
	);
	const prev = Array.from(
		{
			length: ROWS,
		},
		() => Array(COLS).fill(null)
	);
	const pq = new PQ();
	dist[start.r][start.c] = 0;
	pq.push(start, 0);
	let visitedCount = 0;
	while (!pq.empty() && !runState.paused) {
		const cur = pq.pop();
		const cd = dist[cur.r][cur.c];
		if (grid[cur.r][cur.c].el)
			grid[cur.r][cur.c].el.classList.add("closed");
		visitedCount++;
		visitedCountEl.textContent = visitedCount;
		if (cur.r === end.r && cur.c === end.c) {
			reconstruct(prev);
			return;
		}
		for (const n of neighbors(cur.r, cur.c)) {
			if (grid[n.r][n.c].obs) continue;
			const w = grid[n.r][n.c].weight || 1;
			if (cd + w < dist[n.r][n.c]) {
				dist[n.r][n.c] = cd + w;
				prev[n.r][n.c] = cur;
				pq.push(n, dist[n.r][n.c]);
				if (!(n.r === end.r && n.c === end.c))
					grid[n.r][n.c].el.classList.add("open");
			}
		}
		const delay = 200 - +document.getElementById("speedRange").value;
		await sleep(delay);
	}
}

async function astar(heurType) {
	const hfn = heuristicFn(heurType);
	const g = Array.from(
		{
			length: ROWS,
		},
		() => Array(COLS).fill(Infinity)
	);
	const f = Array.from(
		{
			length: ROWS,
		},
		() => Array(COLS).fill(Infinity)
	);
	const prev = Array.from(
		{
			length: ROWS,
		},
		() => Array(COLS).fill(null)
	);
	const open = new PQ();
	g[start.r][start.c] = 0;
	f[start.r][start.c] = hfn(start, end);
	open.push(start, f[start.r][start.c]);
	let visitedCount = 0;
	while (!open.empty() && !runState.paused) {
		const cur = open.pop();
		if (grid[cur.r][cur.c].el)
			grid[cur.r][cur.c].el.classList.add("closed");
		visitedCount++;
		visitedCountEl.textContent = visitedCount;
		if (cur.r === end.r && cur.c === end.c) {
			reconstruct(prev, g[end.r][end.c]);
			return;
		}
		const nb = neighbors(cur.r, cur.c);
		for (const n of nb) {
			if (grid[n.r][n.c].obs) continue;
			const tentative = g[cur.r][cur.c] + (grid[n.r][n.c].weight || 1);
			if (tentative < g[n.r][n.c]) {
				g[n.r][n.c] = tentative;
				f[n.r][n.c] = tentative + hfn(n, end);
				prev[n.r][n.c] = cur;
				open.push(n, f[n.r][n.c]);
				if (!(n.r === end.r && n.c === end.c)) {
					grid[n.r][n.c].el.classList.add("open");
					// show g,h,f small overlay
					const ov = grid[n.r][n.c].el.querySelector(".overlay");
					ov.textContent = `${Math.round(g[n.r][n.c])}`;
				}
			}
		}
		const delay = 200 - +document.getElementById("speedRange").value;
		await sleep(delay);
	}
}

function reconstruct(prev, cost) {
	const path = [];
	let cur = end;
	while (cur) {
		path.push(cur);
		cur = prev[cur.r] ? prev[cur.r][cur.c] : null;
		if (cur && cur.r === start.r && cur.c === start.c) break;
	}
	// draw path
	path.reverse();
	pathLenEl.textContent = path.length;
	pathCostEl.textContent = cost || "--";
	path.forEach((p) => {
		grid[p.r][p.c].el.classList.remove("open", "closed");
		grid[p.r][p.c].el.classList.add("path");
	});
}

// Buttons
document.getElementById("startBtn").onclick = () => {
	if (!runState.running) runAlgorithm();
};
document.getElementById("pauseBtn").onclick = () => {
	runState.paused = !runState.paused;
};
document.getElementById("stepBtn").onclick = async () => {
	if (!runState.running) {
		mode = "";
		runState.paused = false;
		await runAlgorithm();
		runState.paused = true;
	}
};
document.getElementById("resetBtn").onclick = () => {
	for (let r = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++) {
			grid[r][c].el.classList.remove("open", "closed", "path");
			grid[r][c].el.classList.remove("start", "end");
		}
	renderSpecials();
	runState.paused = false;
	runState.running = false;
};

// Initial overlay update
for (let r = 0; r < ROWS; r++)
	for (let c = 0; c < COLS; c++) updateCellOverlay(grid[r][c]);

// Keywords for further research (printed to console)
console.log(
	"Keywords: A*, Dijkstra, BFS, heuristic, g/h/f, weighted grid, moving obstacles, replanning, visualization"
);
