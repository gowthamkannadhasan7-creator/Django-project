/**
 * game.js — Escape Maze logic
 * Handles maze generation, player movement, collision, timer, and score saving.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ─────────────────────────────────────────────────────────────
  // DOM Elements & Configuration
  // ─────────────────────────────────────────────────────────────
  const config = window.GAME_CONFIG || { rows: 15, cols: 15, difficulty: 'medium' };
  const rows = config.rows;
  const cols = config.cols;
  
  const canvas = document.getElementById('maze-canvas');
  if (!canvas) return; // Not on the game page

  const ctx = canvas.getContext('2d');
  
  // Game dimensions
  const width = canvas.width;
  const height = canvas.height;
  const cellWidth = width / cols;
  const cellHeight = height / rows;

  // Colors
  const COLOR_WALL = '#333';
  const COLOR_BG = '#000';
  const COLOR_PLAYER = '#00ffcc';
  const COLOR_GOAL = '#00ff88';
  const COLOR_PATH = '#111';

  // Game State
  let grid = [];
  let player = { r: 0, c: 0 };
  let enemy = { r: rows - 1, c: 0 }; // Enemy starts bottom-left
  let goal = { r: rows - 1, c: cols - 1 };
  
  // Timer State
  let timerInterval = null;
  let startTime = 0;
  let elapsedSeconds = 0;
  let gameStarted = false;
  let gameOver = false;
  
  // UI Elements
  const timerDisplay = document.getElementById('timer-display');
  const winOverlay = document.getElementById('win-overlay');
  let finalTimeDisplay = document.getElementById('final-time');
  const restartBtn = document.getElementById('restart-btn');
  const playAgainBtn = document.getElementById('play-again-btn');
  const saveScoreBtn = document.getElementById('save-score-btn');

  // Enemy movement interval
  let enemyInterval = null;

  // ─────────────────────────────────────────────────────────────
  // Maze Generation (Recursive Backtracker)
  // ─────────────────────────────────────────────────────────────
  class Cell {
    constructor(r, c) {
      this.r = r;
      this.c = c;
      this.visited = false;
      // Walls: [top, right, bottom, left]
      this.walls = [true, true, true, true];
    }
  }

  function index(r, c) {
    if (r < 0 || c < 0 || r >= rows || c >= cols) return -1;
    return c + r * cols;
  }

  function generateMaze() {
    grid = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        grid.push(new Cell(r, c));
      }
    }

    let stack = [];
    let current = grid[0];
    current.visited = true;

    // DFS generation
    let unvisitedCount = rows * cols - 1;
    
    while (unvisitedCount > 0) {
      let neighbors = [];
      const { r, c } = current;

      // Check top
      let top = grid[index(r - 1, c)];
      if (top && !top.visited) neighbors.push({ cell: top, dir: 'top' });
      // Check right
      let right = grid[index(r, c + 1)];
      if (right && !right.visited) neighbors.push({ cell: right, dir: 'right' });
      // Check bottom
      let bottom = grid[index(r + 1, c)];
      if (bottom && !bottom.visited) neighbors.push({ cell: bottom, dir: 'bottom' });
      // Check left
      let left = grid[index(r, c - 1)];
      if (left && !left.visited) neighbors.push({ cell: left, dir: 'left' });

      if (neighbors.length > 0) {
        // Choose random neighbor
        let nextData = neighbors[Math.floor(Math.random() * neighbors.length)];
        let next = nextData.cell;
        stack.push(current);

        // Remove walls
        if (nextData.dir === 'top') { current.walls[0] = false; next.walls[2] = false; }
        else if (nextData.dir === 'right') { current.walls[1] = false; next.walls[3] = false; }
        else if (nextData.dir === 'bottom') { current.walls[2] = false; next.walls[0] = false; }
        else if (nextData.dir === 'left') { current.walls[3] = false; next.walls[1] = false; }

        next.visited = true;
        unvisitedCount--;
        current = next;
      } else if (stack.length > 0) {
        current = stack.pop();
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Drawing Functions
  // ─────────────────────────────────────────────────────────────
  function drawMaze() {
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = COLOR_WALL;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (let i = 0; i < grid.length; i++) {
      let cell = grid[i];
      let x = cell.c * cellWidth;
      let y = cell.r * cellHeight;

      // Fill path background for contrast
      ctx.fillStyle = COLOR_PATH;
      ctx.fillRect(x, y, cellWidth, cellHeight);

      // Draw walls
      ctx.beginPath();
      // Top
      if (cell.walls[0]) { ctx.moveTo(x, y); ctx.lineTo(x + cellWidth, y); }
      // Right
      if (cell.walls[1]) { ctx.moveTo(x + cellWidth, y); ctx.lineTo(x + cellWidth, y + cellHeight); }
      // Bottom
      if (cell.walls[2]) { ctx.moveTo(x, y + cellHeight); ctx.lineTo(x + cellWidth, y + cellHeight); }
      // Left
      if (cell.walls[3]) { ctx.moveTo(x, y); ctx.lineTo(x, y + cellHeight); }
      ctx.stroke();
    }
  }

  function drawEntity(r, c, color, sizeRatio = 0.6) {
    let x = c * cellWidth + cellWidth / 2;
    let y = r * cellHeight + cellHeight / 2;
    let radius = (Math.min(cellWidth, cellHeight) / 2) * sizeRatio;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Add a glowing effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0; // reset
  }

  function render() {
    drawMaze();
    drawEntity(goal.r, goal.c, COLOR_GOAL, 0.7);
    drawEntity(player.r, player.c, COLOR_PLAYER, 0.5);
    drawEntity(enemy.r, enemy.c, '#ff3366', 0.5); // Draw enemy in red
  }

  // ─────────────────────────────────────────────────────────────
  // Enemy Logic
  // ─────────────────────────────────────────────────────────────
  function startEnemy() {
    if (enemyInterval) clearInterval(enemyInterval);
    enemyInterval = setInterval(() => {
      if (gameOver) return;
      moveEnemy();
    }, config.difficulty === 'hard' ? 300 : (config.difficulty === 'medium' ? 500 : 700));
  }

  function stopEnemy() {
    if (enemyInterval) clearInterval(enemyInterval);
  }

  function moveEnemy() {
    // Advanced AI using BFS (Breadth-First Search) to find shortest path to player
    
    // First safely map cell objects back to grid indices for visited arrays
    const targetIdx = index(player.r, player.c);
    const startIdx = index(enemy.r, enemy.c);
    
    if (startIdx === targetIdx || targetIdx === -1 || startIdx === -1) {
      checkCollision();
      return;
    }

    // BFS setup
    let queue = [startIdx];
    let visited = new Array(rows * cols).fill(false);
    let parent = new Array(rows * cols).fill(-1);
    visited[startIdx] = true;

    // Run BFS
    let found = false;
    while (queue.length > 0) {
      let currIdx = queue.shift();
      
      if (currIdx === targetIdx) {
        found = true;
        break;
      }

      let r = Math.floor(currIdx / cols);
      let c = currIdx % cols;
      let cell = grid[currIdx];

      // Array of potential neighbor coords: [r, c, directionWallIndex]
      const neighbors = [
        [r - 1, c, 0], // up
        [r, c + 1, 1], // right
        [r + 1, c, 2], // down
        [r, c - 1, 3]  // left
      ];

      for (let i = 0; i < neighbors.length; i++) {
        let [nr, nc, wallCheck] = neighbors[i];
        let nIdx = index(nr, nc);
        
        if (nIdx !== -1 && !cell.walls[wallCheck] && !visited[nIdx]) {
          visited[nIdx] = true;
          parent[nIdx] = currIdx;
          queue.push(nIdx);
        }
      }
    }

    // Trace path back from player to enemy to find the immediate next step to take
    if (found) {
      let stepIdx = targetIdx;
      while (parent[stepIdx] !== startIdx && parent[stepIdx] !== -1) {
        stepIdx = parent[stepIdx];
      }
      // stepIdx is now the immediate neighbor the enemy should move into
      enemy.r = Math.floor(stepIdx / cols);
      enemy.c = stepIdx % cols;
    } else {
      // Fallback (failsafe, though connected mazes shouldn't have unreachable targets)
      // Jiggle randomly 
      let cell = grid[startIdx];
      let possibleDirs = [];
      if (!cell.walls[0]) possibleDirs.push('up');
      if (!cell.walls[1]) possibleDirs.push('right');
      if (!cell.walls[2]) possibleDirs.push('down');
      if (!cell.walls[3]) possibleDirs.push('left');
      
      if (possibleDirs.length > 0) {
        let randomDir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
        if (randomDir === 'up') enemy.r--;
        else if (randomDir === 'right') enemy.c++;
        else if (randomDir === 'down') enemy.r++;
        else if (randomDir === 'left') enemy.c--;
      }
    }

    render();
    checkCollision();
  }

  function checkCollision() {
    if (player.r === enemy.r && player.c === enemy.c) {
      loseGame();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Timer Logic
  // ─────────────────────────────────────────────────────────────
  function updateTimer() {
    let now = Date.now();
    elapsedSeconds = (now - startTime) / 1000;
    timerDisplay.textContent = elapsedSeconds.toFixed(2) + 's';
  }

  function startTimer() {
    if (!gameStarted && !gameOver) {
      gameStarted = true;
      startTime = Date.now();
      timerInterval = setInterval(updateTimer, 50);
    }
  }

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
  }

  // ─────────────────────────────────────────────────────────────
  // Game Flow
  // ─────────────────────────────────────────────────────────────
  function loseGame() {
    gameOver = true;
    stopTimer();
    stopEnemy();
    
    const nextLevelBtn = document.getElementById('next-level-btn');
    if (nextLevelBtn) nextLevelBtn.style.display = 'none';
    
    setTimeout(() => {
      winOverlay.style.display = 'flex';
      document.getElementById('save-score-form').style.display = 'none';
      document.querySelector('.win-dialog h3').textContent = '💀 You Died!';
      document.querySelector('.win-dialog p').innerHTML = `Caught by the enemy!<br>Time survived: <span>${elapsedSeconds.toFixed(2)}</span> seconds`;
    }, 500);
  }

  function winGame() {
    gameOver = true;
    stopTimer();
    stopEnemy();
    finalTimeDisplay.textContent = elapsedSeconds.toFixed(2);
    
    const nextLevelBtn = document.getElementById('next-level-btn');
    if (nextLevelBtn) {
      if (config.difficulty === 'easy') {
        nextLevelBtn.href = '/game/?difficulty=medium';
        nextLevelBtn.style.display = 'inline-block';
      } else if (config.difficulty === 'medium') {
        nextLevelBtn.href = '/game/?difficulty=hard';
        nextLevelBtn.style.display = 'inline-block';
      } else {
        nextLevelBtn.style.display = 'none';
      }
    }
    
    // Slight delay before showing overlay for dramatic effect
    setTimeout(() => {
      winOverlay.style.display = 'flex';
      document.getElementById('save-message').textContent = '';
      document.getElementById('player-name').value = '';
      saveScoreBtn.disabled = false;
      saveScoreBtn.textContent = 'Save Score';
    }, 500);
  }

  function movePlayer(dir) {
    if (gameOver) return;

    if (!gameStarted) {
      startTimer(); // Starts on first move
      startEnemy(); // Enemy starts moving on first move
    }

    let currentCell = grid[index(player.r, player.c)];
    
    if (dir === 'up' && !currentCell.walls[0]) player.r--;
    else if (dir === 'right' && !currentCell.walls[1]) player.c++;
    else if (dir === 'down' && !currentCell.walls[2]) player.r++;
    else if (dir === 'left' && !currentCell.walls[3]) player.c--;

    render();

    // Check Win/Lose
    checkCollision();
    if (player.r === goal.r && player.c === goal.c) {
      winGame();
    }
  }

  function resetGame() {
    gameOver = false;
    gameStarted = false;
    stopTimer();
    stopEnemy();
    elapsedSeconds = 0;
    timerDisplay.textContent = '0.00s';
    player = { r: 0, c: 0 };
    enemy = { r: rows - 1, c: 0 };
    winOverlay.style.display = 'none';
    
    // reset dialog UI to default "Win" state just in case it was a "Lose"
    document.getElementById('save-score-form').style.display = 'flex';
    document.querySelector('.win-dialog h3').textContent = '🎉 You Escaped!';
    document.querySelector('.win-dialog p').innerHTML = `Time: <span id="final-time">--</span> seconds`;
    // Update reference to final-time for winGame() to use
    finalTimeDisplay = document.getElementById('final-time');

    generateMaze();
    render();
  }

  // ─────────────────────────────────────────────────────────────
  // Event Listeners
  // ─────────────────────────────────────────────────────────────
  
  // Keyboard Input
  window.addEventListener('keydown', (e) => {
    // Prevent default scrolling for arrows and space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') movePlayer('up');
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') movePlayer('right');
    if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') movePlayer('down');
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') movePlayer('left');
  });

  // Mobile / On-screen Controls
  document.getElementById('btn-up')?.addEventListener('click', () => movePlayer('up'));
  document.getElementById('btn-right')?.addEventListener('click', () => movePlayer('right'));
  document.getElementById('btn-down')?.addEventListener('click', () => movePlayer('down'));
  document.getElementById('btn-left')?.addEventListener('click', () => movePlayer('left'));

  // Utility Buttons
  restartBtn.addEventListener('click', resetGame);
  playAgainBtn.addEventListener('click', resetGame);

  // API Call: Save Score
  saveScoreBtn.addEventListener('click', () => {
    const nameInput = document.getElementById('player-name').value.trim();
    const msgBox = document.getElementById('save-message');
    
    if (!nameInput) {
      msgBox.textContent = "Please enter a name first.";
      msgBox.style.color = "#ff3366";
      return;
    }

    saveScoreBtn.disabled = true;
    saveScoreBtn.textContent = 'Saving...';

    const payload = {
      player_name: nameInput,
      time_seconds: elapsedSeconds,
      difficulty: config.difficulty
    };

    fetch(config.saveScoreUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Using CSRF exemption on the backend for simplicity as requested by views.py
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'saved') {
        msgBox.textContent = `Score Saved! You ranked #${data.rank} in ${config.difficulty} mode!`;
        msgBox.style.color = "#00ff88"; // Success color
        saveScoreBtn.style.display = 'none';
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    })
    .catch(err => {
      console.error(err);
      msgBox.textContent = "Error saving score. Try again.";
      msgBox.style.color = "#ff3366";
      saveScoreBtn.disabled = false;
      saveScoreBtn.textContent = 'Save Score';
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Init
  // ─────────────────────────────────────────────────────────────
  resetGame(); // Generates initial maze and renders

});
