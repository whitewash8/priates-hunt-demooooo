const state = {
    bucket5: 0,
    bucket3: 0,
    maxCapacity5: 5,
    maxCapacity3: 3,
    moves: 0,
    dragSource: null,
    dragStartX: 0,
    dragStartY: 0,
    startTime: null
  };

  const hints = [
    "Hint: Tap the tap to fill a jug",
    "Hint: Drag one jug onto another to transfer water",
    "Hint: Tap the trash to empty a jug"
  ];

  let currentHintIndex = 0;

  // Initialize the game
  window.onload = function() {
    document.getElementById('game-screen').style.display = 'flex';
    document.getElementById('win-screen').style.display = 'none';
    updateVisuals();
    
    // Start tracking time
    state.startTime = new Date();
    
    // Prevent default behavior for touch events
    document.addEventListener('touchmove', function(e) {
      if (state.dragSource !== null) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Set up touch events for mobile
    setupTouchEvents();
    
    // Adjust the height to use full screen
    adjustHeight();
    window.addEventListener('resize', adjustHeight);

    // Start rotating hints
    startRotatingHints();
  };
  
  // Adjust component heights to use full screen
  function adjustHeight() {
    const screenHeight = window.innerHeight;
    const gameScreen = document.getElementById('game-screen');
    if (!gameScreen) return;
    
    gameScreen.style.height = screenHeight + 'px';
    
    // Make sure buckets-container has enough space
    const headerElement = document.querySelector('h1');
    const instructionsElement = document.querySelector('.instructions');
    const goalElement = document.querySelector('.goal');
    const dragHintElement = document.querySelector('.drag-hint');
    const bucketsContainer = document.querySelector('.buckets-container');
    
    if (!headerElement || !instructionsElement || !goalElement || !dragHintElement || !bucketsContainer) return;
    
    const header = headerElement.offsetHeight;
    const instructions = instructionsElement.offsetHeight;
    const goal = goalElement.offsetHeight;
    const dragHint = dragHintElement.offsetHeight;
    
    const availableHeight = screenHeight - header - instructions - goal - dragHint - 60; // extra padding
    bucketsContainer.style.minHeight = Math.max(availableHeight, 250) + 'px'; // Set minimum height
  }

  // Setup touch events
  function setupTouchEvents() {
    const buckets = document.querySelectorAll('.bucket-visual');
    
    // Add touch event listeners
    buckets.forEach(bucket => {
      bucket.addEventListener('touchmove', handleTouchMove);
    });
    
    // Prevent scrolling when interacting with game elements
    document.querySelectorAll('.tap, .valve, button').forEach(el => {
      el.addEventListener('touchstart', e => e.preventDefault());
    });
  }

  // Touch drag start
  function startDrag(event, size) {
    state.dragSource = size;
    const touch = event.touches[0];
    state.dragStartX = touch.clientX;
    state.dragStartY = touch.clientY;
    
    // Visual feedback
    event.currentTarget.style.opacity = '0.7';
  }

  // Touch drag end
  function endDrag(event) {
    if (state.dragSource === null) return;
    
    // Reset visual feedback
    document.querySelectorAll('.bucket-visual').forEach(bucket => {
      bucket.style.opacity = '1';
      bucket.style.borderColor = '';
    });
    
    state.dragSource = null;
  }

  // Handle touch move
  function handleTouchMove(event) {
    if (state.dragSource === null) return;
    
    const touch = event.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    
    // Check if touch is over a bucket
    const elementsAtPoint = document.elementsFromPoint(currentX, currentY);
    const targetBucket = elementsAtPoint.find(el => 
      el.classList.contains('bucket-visual') && 
      el.parentElement.id !== 'bucket' + state.dragSource
    );
    
    if (targetBucket) {
      // Visual feedback for potential drop target
      targetBucket.style.borderColor = '#4CAF50';
      
      // Check distance moved to determine if this is a drag or a tap
      const distX = Math.abs(currentX - state.dragStartX);
      const distY = Math.abs(currentY - state.dragStartY);
      
      if (distX > 10 || distY > 10) {
        // Consider it a drag if moved more than 10px
        const targetSize = targetBucket.parentElement.id === 'bucket5' ? 5 : 3;
        
        // Transfer water to target bucket
        if (state.dragSource !== targetSize) {
          transferWater(state.dragSource, targetSize);
          
          // Reset drag state
          state.dragSource = null;
          
          // Reset visual feedback
          document.querySelectorAll('.bucket-visual').forEach(bucket => {
            bucket.style.opacity = '1';
            bucket.style.borderColor = '';
          });
        }
      }
    }
  }

  // Fill a bucket to capacity
  function fillBucket(size) {
    if (size === 5) {
      state.bucket5 = state.maxCapacity5;
    } else {
      state.bucket3 = state.maxCapacity3;
    }
    updateVisuals();
    checkWin();
  }

  // Empty a bucket
  function emptyBucket(size) {
    if (size === 5) {
      state.bucket5 = 0;
    } else {
      state.bucket3 = 0;
    }
    updateVisuals();
    checkWin();
  }

  // Transfer water between buckets
  function transferWater(sourceSize, targetSize) {
    if (sourceSize === 5 && targetSize === 3) {
      // Transfer from 5L to 3L
      const spaceIn3 = state.maxCapacity3 - state.bucket3;
      if (spaceIn3 > 0 && state.bucket5 > 0) {
        const amountToTransfer = Math.min(state.bucket5, spaceIn3);
        state.bucket3 += amountToTransfer;
        state.bucket5 -= amountToTransfer;
      }
    } else {
      // Transfer from 3L to 5L
      const spaceIn5 = state.maxCapacity5 - state.bucket5;
      if (spaceIn5 > 0 && state.bucket3 > 0) {
        const amountToTransfer = Math.min(state.bucket3, spaceIn5);
        state.bucket5 += amountToTransfer;
        state.bucket3 -= amountToTransfer;
      }
    }
    
    state.moves++;
    updateVisuals();
    checkWin();
  }

  // Update visual representation of water
  function updateVisuals() {
    // Update 5L jug
    document.getElementById('amount5').textContent = state.bucket5 + 'L';
    const water5 = document.getElementById('water5');
    const height5 = (state.bucket5 / state.maxCapacity5) * 100;
    water5.style.height = height5 + '%';
    
    // Update current level indicator position for 5L bucket
    const currentLevel5 = document.getElementById('current-level5');
    currentLevel5.textContent = state.bucket5 + 'L';
    
    // Position the current level indicator based on water height
    if (state.bucket5 > 0) {
      const bucket5Height = document.querySelector('#bucket5 .bucket-visual').offsetHeight;
      const position = bucket5Height - (height5 * bucket5Height / 100);
      currentLevel5.style.top = position + 'px';
      currentLevel5.style.display = 'block';
    } else {
      currentLevel5.style.display = 'none';
    }
    
    // Update 3L jug
    document.getElementById('amount3').textContent = state.bucket3 + 'L';
    const water3 = document.getElementById('water3');
    const height3 = (state.bucket3 / state.maxCapacity3) * 100;
    water3.style.height = height3 + '%';
    
    // Update current level indicator position for 3L bucket
    const currentLevel3 = document.getElementById('current-level3');
    currentLevel3.textContent = state.bucket3 + 'L';
    
    // Position the current level indicator based on water height
    if (state.bucket3 > 0) {
      const bucket3Height = document.querySelector('#bucket3 .bucket-visual').offsetHeight;
      const position = bucket3Height - (height3 * bucket3Height / 100);
      currentLevel3.style.top = position + 'px';
      currentLevel3.style.display = 'block';
    } else {
      currentLevel3.style.display = 'none';
    }
  }

  // Check if the win condition is met
  function checkWin() {
    if (state.bucket5 === 4) {
      setTimeout(() => {
        showWinScreen();
      }, 1000);
    }
  }

  // Reset the game
  function resetGame() {
    state.bucket5 = 0;
    state.bucket3 = 0;
    state.moves = 0;
    state.startTime = new Date();
    updateVisuals();
  }

  // Show the win screen
  function showWinScreen() {
    // Calculate completion time
    const endTime = new Date();
    const timeDiff = Math.floor((endTime - state.startTime) / 1000); // in seconds
    const minutes = Math.floor(timeDiff / 60);
    const seconds = timeDiff % 60;
    
    // Update completion time display
    document.getElementById('completion-time').textContent = `${minutes}m ${seconds}s`;
    
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('win-screen').style.display = 'flex';
    
    // Create confetti effect
    createConfetti();
    
    setTimeout(() => {
      window.location.href = 'https://docs.google.com/forms/d/e/1FAIpQLSc_VB_2bODsMvn5RlciD1nONL6cZ7AiUst0zcQpoXrprimSiw/viewform';
    }, 4000);
  }

  // Create confetti effect
  function createConfetti() {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
    
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDelay = Math.random() * 2 + 's';
      confetti.style.setProperty('--translateX', Math.random() * 100 - 50);
      confetti.style.setProperty('--rotate', Math.random() * 360);
      
      document.body.appendChild(confetti);
      
      // Remove confetti after animation
      setTimeout(() => {
        confetti.remove();
      }, 6000);
    }
  }

  function startRotatingHints() {
    // Show first hint immediately
    updateHint();
    
    // Rotate hints every 6 seconds
    setInterval(() => {
      currentHintIndex = (currentHintIndex + 1) % hints.length;
      updateHint();
    }, 6000);
  }

  function updateHint() {
    const dragHint = document.querySelector('.drag-hint');
    // Add fade out effect
    dragHint.style.opacity = '0';
    
    setTimeout(() => {
      dragHint.textContent = hints[currentHintIndex];
      // Add fade in effect
      dragHint.style.opacity = '1';
    }, 300);
  }