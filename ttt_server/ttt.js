const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

const rooms = new Map();

function createRoom(room){
  if(!rooms.has(room)){
    rooms.set(room,{
      players:[],
      symbols:{},
      board:Array(9).fill(null),
      turn:'X',
      status:'waiting',
      winner:null
    });
  }
}

function checkWin(b){
  const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for(const [a,b1,c] of L){
    if(b[a] && b[a]===b1 && b[a]===b[c]) return b[a];
  }
  if(b.every(v=>v!==null)) return 'draw';
  return null;
}

io.on('connection',socket=>{
  socket.on('joinRoom',({room})=>{
    room=String(room||'main');
    socket.join(room);
    createRoom(room);
    const r=rooms.get(room);

    if(!r.players.includes(socket.id)&&r.players.length<2)
      r.players.push(socket.id);

    if(!r.symbols[socket.id]){
      r.symbols[socket.id] = Object.values(r.symbols).includes('X')?'O':'X';
    }

    if(r.players.length===2){
      r.status='playing';
      r.turn='X';
      r.board=Array(9).fill(null);
      r.winner=null;
    }

    io.to(room).emit('roomUpdate',r);
  });

  socket.on('makeMove',({room,index})=>{
    const r=rooms.get(room);
    if(!r||r.status!=='playing')return;
    const sym=r.symbols[socket.id];
    if(!sym||sym!==r.turn)return;
    if(r.board[index]!==null)return;

    r.board[index]=sym;
    const res=checkWin(r.board);
    if(res){r.status='finished';r.winner=res;} else {r.turn=r.turn==='X'?'O':'X';}

    io.to(room).emit('roomUpdate',r);
  });

  socket.on('requestRematch',({room})=>{
    const r=rooms.get(room);
    if(!r)return;
    r.board=Array(9).fill(null);
    r.turn='X';
    r.status=r.players.length===2?'playing':'waiting';
    r.winner=null;
    io.to(room).emit('roomUpdate',r);
  });

  socket.on('leaveRoom',({room})=>{
    const r=rooms.get(room);
    if(!r)return;
    r.players=r.players.filter(p=>p!==socket.id);
    delete r.symbols[socket.id];
    r.status='waiting';
    r.board=Array(9).fill(null);
    r.turn='X';
    r.winner=null;
    io.to(room).emit('roomUpdate',r);
  });
});

// Serve static index.html
app.use(express.static(__dirname + '/public'));

server.listen(PORT,()=>console.log('http://localhost:'+PORT));