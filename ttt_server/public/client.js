const socket = io();
let currentRoom = null;
let mySymbol = null;

const statusEl = document.getElementById('status');
const turnEl = document.getElementById('turn');
const boardEl = document.getElementById('board');
const joinBtn = document.getElementById('joinBtn');
const roomInput = document.getElementById('roomInput');
const rematchBtn = document.getElementById('rematch');

boardEl.innerHTML = Array(9)
  .fill(0)
  .map((_, i) => `<div data-i="${i}" class="aspect-square flex items-center justify-center text-4xl bg-gray-700 cursor-pointer select-none"></div>`)
  .join('');

boardEl.addEventListener('click', (e) => {
  const cell = e.target;
  if (!cell.dataset.i) return;
  const index = Number(cell.dataset.i);
  socket.emit('makeMove', { room: currentRoom, index });
});

joinBtn.onclick = () => {
  const room = roomInput.value.trim();
  if (!room) return alert('Enter a room name');
  currentRoom = room;
  socket.emit('joinRoom', { room });
};

rematchBtn.onclick = () => {
  socket.emit('requestRematch', { room: currentRoom });
};

socket.on('roomUpdate', (r) => {
  mySymbol = r.symbols[socket.id];
  statusEl.textContent = `Room: ${currentRoom} — You are ${mySymbol || '?'}`;

  boardEl.querySelectorAll('div').forEach((cell, i) => {
    cell.textContent = r.board[i] || '';
  });

  if (r.status === 'playing') {
    turnEl.textContent = r.turn === mySymbol ? 'Your turn' : "Opponent's turn";
    rematchBtn.classList.add('hidden');

  } else if (r.status === 'finished') {
    if (r.winner === 'draw') turnEl.textContent = 'Draw!';
    else if (r.winner === mySymbol) turnEl.textContent = 'You win!';
    else turnEl.textContent = 'You lose!';
    rematchBtn.classList.remove('hidden');
  }
});