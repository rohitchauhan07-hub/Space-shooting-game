(() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
  
    // Game variables
    let leftPressed = false;
    let rightPressed = false;
    let spacePressed = false;
    let lastFireTime = 0;
    const fireInterval = 250; // milliseconds
  
    const playerWidth = 40;
    const playerHeight = 40;
    const playerSpeed = 5;
  
    const laserWidth = 4;
    const laserHeight = 14;
    const laserSpeed = 8;
  
    const enemyRows = 4;
    const enemyCols = 8;
    const enemyWidth = 32;
    const enemyHeight = 28;
    const enemyGapX = 20;
    const enemyGapY = 20;
    let enemyDirection = 1; // 1 = right, -1 = left
    let enemySpeed = 1.0; // pixels per frame
    let enemyDescendStep = 20;
  
    let score = 0;
    let gameOver = false;
  
    // Entities
    const player = {
      x: (width - playerWidth) / 2,
      y: height - playerHeight - 10,
      width: playerWidth,
      height: playerHeight,
      color: '#0ff'
    };
  
    const lasers = [];
  
    // Create enemies matrix
    let enemies = [];
    function resetEnemies() {
      enemies = [];
      const offsetX = (width - (enemyCols * (enemyWidth + enemyGapX) - enemyGapX)) / 2;
      const offsetY = 60;
      for(let r = 0; r < enemyRows; r++) {
        for(let c = 0; c < enemyCols; c++) {
          enemies.push({
            x: offsetX + c * (enemyWidth + enemyGapX),
            y: offsetY + r * (enemyHeight + enemyGapY),
            width: enemyWidth,
            height: enemyHeight,
            alive: true,
            color: '#0ff'
          });
        }
      }
    }
  
    // Draw player ship
    function drawPlayer() {
      ctx.save();
      ctx.fillStyle = player.color;
      ctx.beginPath();
      // A cool futuristic spaceship shape
      ctx.moveTo(player.x + player.width / 2, player.y);
      ctx.lineTo(player.x, player.y + player.height);
      ctx.lineTo(player.x + player.width * 0.3, player.y + player.height * 0.7);
      ctx.lineTo(player.x + player.width * 0.7, player.y + player.height * 0.7);
      ctx.lineTo(player.x + player.width, player.y + player.height);
      ctx.closePath();
      ctx.fill();
      // Thruster glow
      let gradient = ctx.createRadialGradient(player.x + player.width/2, player.y + player.height, 4, player.x + player.width/2, player.y + player.height+10, 20);
      gradient.addColorStop(0, 'rgba(0,255,255,0.6)');
      gradient.addColorStop(1, 'rgba(0,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(player.x + player.width/2, player.y + player.height + 10, 10, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  
    // Draw lasers
    function drawLasers() {
      ctx.fillStyle = '#0ff';
      lasers.forEach(l => {
        ctx.fillRect(l.x, l.y, laserWidth, laserHeight);
      });
    }
  
    // Draw enemies
    function drawEnemies() {
      enemies.forEach(e => {
        if (!e.alive) return;
        ctx.save();
        ctx.fillStyle = e.color;
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 10;
        // Alien shape - circle with eyes
        ctx.beginPath();
        ctx.ellipse(e.x + e.width/2, e.y + e.height/2, e.width/2, e.height/1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(e.x + e.width*0.35, e.y + e.height*0.45, e.width*0.1, e.height*0.2, 0, 0, Math.PI * 2);
        ctx.ellipse(e.x + e.width*0.65, e.y + e.height*0.45, e.width*0.1, e.height*0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }
  
    // Move player based on input
    function updatePlayer() {
      if (leftPressed) {
        player.x -= playerSpeed;
        if (player.x < 0) player.x = 0;
      }
      if (rightPressed) {
        player.x += playerSpeed;
        if (player.x + player.width > width) player.x = width - player.width;
      }
    }
  
    // Update lasers position
    function updateLasers() {
      for(let i = lasers.length - 1; i >= 0; i--) {
        lasers[i].y -= laserSpeed;
        if(lasers[i].y + laserHeight < 0) {
          lasers.splice(i, 1);
        }
      }
    }
  
    // Update enemies position and movement
    function updateEnemies() {
      let shiftDown = false;
      // Calculate boundary extremes of alive enemies
      let leftMost = width, rightMost = 0;
      let lowestY = 0;
      enemies.forEach(e => {
        if (!e.alive) return;
        if (e.x < leftMost) leftMost = e.x;
        if (e.x + e.width > rightMost) rightMost = e.x + e.width;
        if (e.y + e.height > lowestY) lowestY = e.y + e.height;
      });
  
      // If hit side boundary, reverse and descend
      if (enemyDirection === 1 && rightMost + enemySpeed > width - 10) {
        enemyDirection = -1;
        shiftDown = true;
      } else if (enemyDirection === -1 && leftMost - enemySpeed < 10) {
        enemyDirection = 1;
        shiftDown = true;
      }
  
      enemies.forEach(e => {
        if (!e.alive) return;
        e.x += enemySpeed * enemyDirection;
        if (shiftDown) e.y += enemyDescendStep;
      });
  
      // Increase enemy speed slightly as the game progresses
      if (score > 20) enemySpeed = 1.5;
      if (score > 40) enemySpeed = 2.0;
      if (score > 70) enemySpeed = 2.5;
  
      // Check game over condition if enemies reach bottom or collide with player
      if (lowestY >= player.y) {
        gameOver = true;
      }
    }
  
    // Collision check helper
    function rectIntersect(r1, r2) {
      return !(r2.x > r1.x + r1.width ||
        r2.x + r2.width < r1.x ||
        r2.y > r1.y + r1.height ||
        r2.y + r2.height < r1.y);
    }
  
    // Check collisions between lasers and enemies
    function checkLaserHits() {
      for(let i = lasers.length - 1; i >= 0; i--) {
        let l = lasers[i];
        for(let j = 0; j < enemies.length; j++) {
          let e = enemies[j];
          if (!e.alive) continue;
          if (rectIntersect(l, e)) {
            e.alive = false;
            lasers.splice(i,1);
            score += 1;
            break;
          }
        }
      }
    }
  
    // Check if any enemy collided with player (horizontal plane)
    function checkPlayerCollision() {
      for(let e of enemies) {
        if (!e.alive) continue;
        if (rectIntersect(player, e)) {
          gameOver = true;
        }
      }
    }
  
    // Clear entire canvas
    function clearCanvas() {
      ctx.clearRect(0, 0, width, height);
    }
  
    // Draw stars background
    function drawStars() {
      ctx.save();
      let starCount = 100;
      ctx.fillStyle = '#0ff';
      for(let i=0; i < starCount; i++) {
        let x = (i * 137) % width;
        let y = (i * 89) % height;
        ctx.fillRect(x, y, 1.5, 1.5);
      }
      ctx.restore();
    }
  
    // Fire laser from player position
    function fireLaser() {
      let now = performance.now();
      if (now - lastFireTime > fireInterval) {
        lasers.push({
          x: player.x + player.width/2 - laserWidth/2,
          y: player.y - laserHeight,
          width: laserWidth,
          height: laserHeight,
        });
        lastFireTime = now;
      }
    }
  
    // Update score display
    function updateScore() {
      document.getElementById('score').textContent = 'Score: ' + score;
    }
  
    // Show game over screen
    function showGameOver() {
      const goScreen = document.getElementById('gameOverScreen');
      const finalScore = document.getElementById('finalScore');
      finalScore.textContent = 'Your Score: ' + score;
      goScreen.style.display = 'flex';
    }
  
    // Game reset
    function resetGame() {
      score = 0;
      gameOver = false;
      player.x = (width - playerWidth) / 2;
      lasers.length = 0;
      enemyDirection = 1;
      enemySpeed = 1.0;
      resetEnemies();
      document.getElementById('gameOverScreen').style.display = 'none';
    }
  
    // Game loop
    function gameLoop() {
      if (!gameOver) {
        clearCanvas();
        drawStars();
        updatePlayer();
        if (spacePressed) fireLaser();
        updateLasers();
        updateEnemies();
        checkLaserHits();
        checkPlayerCollision();
        drawPlayer();
        drawLasers();
        drawEnemies();
        updateScore();
        requestAnimationFrame(gameLoop);
      } else {
        showGameOver();
      }
    }
  
    // Event listeners for controls
    window.addEventListener('keydown', e => {
      if(e.code === 'ArrowLeft' || e.code === 'KeyA') leftPressed = true;
      if(e.code === 'ArrowRight' || e.code === 'KeyD') rightPressed = true;
      if(e.code === 'Space') spacePressed = true;
    });
    window.addEventListener('keyup', e => {
      if(e.code === 'ArrowLeft' || e.code === 'KeyA') leftPressed = false;
      if(e.code === 'ArrowRight' || e.code === 'KeyD') rightPressed = false;
      if(e.code === 'Space') spacePressed = false;
    });
  
    // Restart button
    document.getElementById('restartBtn').addEventListener('click', () => {
      resetGame();
      gameLoop();
    });
  
    // Initialize game
    resetEnemies();
    gameLoop();
  })();
  