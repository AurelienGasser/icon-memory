var mapSize = 16;

var express, app, http, io;
var sockets = [];
var icons;
var board;
var turnedTempTimeouts = [];

readIcons(function(err, _icons) {
  if (err) return;
  icons = _icons;
  initBoard();
  setupExpress();
});

function initBoard() {
  board = [];
  
  for (var j = 0; j < turnedTempTimeouts.length; ++j) {
    clearTimeout(turnedTempTimeouts[j]);
  }

  var numIconsToUse = mapSize / 2;
  var iconsToUse = [];
  for (var k = 0; k < numIconsToUse; ++k) {
    iconsToUse.push([getRandomIcon(), 2]);
  }

  for (var i = 0; i < mapSize; ++i) {
    var idx = Math.floor(Math.random() * Object.keys(iconsToUse).length);
    var o = iconsToUse[idx];
    if (--o[1] == 0) {
      iconsToUse.splice(idx, 1);
    }
    board.push({
      icon: o[0]
    });
  }
}

function getRandomIcon() {
  var idx = Math.floor(Math.random * icons.length);
  return icons.splice(idx, 1)[0];
}

function setupExpress() {
  express = require('express');
  app = express();
  http = require('http').Server(app);
  io = require('socket.io')(http);
  io.set('transports', ['websocket']);

  app.use(express.static('public'));

  http.listen(process.env.PORT || 3000, function() {
    console.log('listening on *:3000');
  });

  io.on('connection', function(socket) {
    sockets.push(socket);
    var playerId = Math.floor(Math.random() * 10000);
    socket.playerId = playerId;
    socket.playerName = 'Player ' + playerId;
    console.log('User connected');
    socket.emit('game-state', getGameState());

    socket.on('send-info', function(data) {
      socket.playerName = data.name;
    })

    socket.on('disconnect', function() {
      var idx = sockets.indexOf(socket);
      if (idx != -1) sockets.splice(sockets, 1)
      console.log('User disconnected');
    });

    socket.on('card-turn', function(data, cb) {
      console.log('card-turn', data);
      
      var icon = board[data.id].icon;
      var canTurn = !board[data.id].turnedTemp && !board[data.id].turned;
      var obj = null;
      
      if (canTurn) {
        obj = {
          playerId: socket.playerId,
          tileId: data.id,
          icon: icon
        };
        if (!socket.previousTurn || socket.previousTurn.icon != icon) {
          socket.previousTurn = obj;
          board[obj.tileId].turnedTemp = socket.playerId;
          turnedTempTimeouts.push(setTimeout(function() {
            board[data.id].turnedTemp = null;
            broadcastGameState();
          }, 2000))
        } else {
          board[socket.previousTurn.tileId].turned = socket.playerId;
          board[obj.tileId].turned = socket.playerId;
          socket.previousTurn = null;
        
          var allTurned = true;
          for (var i = 0; i < mapSize; ++i) {
            if (board[i].player == null) {
              allTurned = false;
              break;
            }
          }

          if (allTurned) {
            initBoard();
          }
        };
      }
      
      cb(obj);
      broadcast('game-state', getGameState())
    });
  });
}

function broadcastGameState() {
  broadcast('game-state', getGameState());
}

function broadcast(message, data) {
  for (var i = 0; i < sockets.length; ++i) {
    sockets[i].emit(message, data);
  };
}

function getGameState() {
  var players = {};

  for (var i = 0; i < sockets.length; ++i) {
    var s = sockets[i];
    players[s.playerId] = {
      name: s.playerName
    };
  }

  var gameState = {
    players: players,
    board: board.map(function(t) {
      if (t.turnedTemp || t.turned) return t;
      return null;
    })
  };

  return gameState;
}

function readIcons(cb) {
  require('fs').readFile('data/all-icons.txt', 'utf-8', function(err, content) {
    if (err) {
      console.log('Cannot load icons: ', err);
      cb(err);
    }
    cb(null, content.split('\n'));
  });
}
