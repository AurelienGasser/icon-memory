var mapSize = 36;
// var mapSize = 16;

var express, app, http, io;
var sockets = [];
var icons;
var board;
var turnedTempTimeouts = [];

readIcons(function (err, _icons) {
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

  for (var cardId = 0; cardId < mapSize; ++cardId) {
    var idx = Math.floor(Math.random() * Object.keys(iconsToUse).length);
    var o = iconsToUse[idx];
    if (--o[1] == 0) {
      iconsToUse.splice(idx, 1);
    }
    board.push({
      icon: o[0],
      cardId: cardId
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

  http.listen(process.env.PORT || 3000, function () {
    console.log('listening on *:3000');
  });

  io.on('connection', function (s) {
    sockets.push(s);
    var playerId = Math.floor(Math.random() * 10000);
    s.playerId = playerId;
    s.playerName = 'Player ' + playerId;
    console.log('User connected');
    s.emit('game-state', getGameState());

    s.on('send-info', function (data) {
      s.playerName = data.playerName;
      s.color = data.color;
      broadcastGameState();
    });

    s.on('disconnect', function () {
      // turn all cards owned by player
      for (var i = 0; i < board.length; ++i) {
        var card = board[i];
        if (card.playerId == s.playerId) {
          card.playerId = null;
          card.temp = false;
        }
      }

      var idx = sockets.indexOf(s);
      if (idx != -1) sockets.splice(s, 1);
      broadcastGameState();
      console.log('User disconnected');
    });
    s.on('reset', (data, cb) => {
      initBoard();
      broadcastGameState();
    });

    s.on('card-turn', function (data, cb) {
      var cardId = data.cardId;
      var card = board[cardId];
      var icon = card.icon;
      var canTurn = !card.playerId && !s.waiting;
      var obj = null;

      if (canTurn) {
        obj = {
          playerId: s.playerId,
          cardId: cardId,
          icon: icon,
        };

        if (!s.previousTurn) {
          // move #1
          board[cardId].playerId = s.playerId;
          board[cardId].temp = true;
          s.previousTurn = obj;
        } else {
          // move #2
          board[cardId].playerId = s.playerId;
          if (s.previousTurn.icon == icon) {
            // yay!
            board[s.previousTurn.cardId].temp = false;
            board[cardId].temp = false;
            s.previousTurn = null;
            var allTurned = true;
            for (var i = 0; i < mapSize; ++i) {
              if (board[i].playerId == null) {
                allTurned = false;
                break;
              }
            }
            if (allTurned) {
              initBoard();
              broadcastGameState();
            }
          } else {
            // nay!
            board[cardId].temp = true;
            s.waiting = true;
            (function (_card) {
              turnedTempTimeouts.push(setTimeout(function () {
                s.waiting = false;
                board[s.previousTurn.cardId].playerId = null;
                board[s.previousTurn.cardId].temp = false;
                _card.playerId = null;
                _card.temp = false;
                s.previousTurn = null;
                broadcastGameState();
              }, 2000));
            })(card);
          }
        }
      }

      cb(obj);
      broadcastGameState();
    });
  });
}

function broadcastGameState() {
  broadcast('game-state', getGameState());
}

function broadcast(message, data) {
  for (var i = 0; i < sockets.length; ++i) {
    sockets[i].emit(message, data);
  }
}

function getPlayerCount(board, playerId) {
  return board.filter(c => c.playerId === playerId && c.found === true).length;
}

function getGameState() {
  var players = {};
  const scores = [];

  for (var i = 0; i < sockets.length; ++i) {
    var s = sockets[i];
    const player = {
      name: s.playerName,
      color: s.color,
      playerId: s.playerId,
      count: getPlayerCount(board, s.playerId)
    };
    players[s.playerId] = player;
    scores.push(player);
  }

  scores.sort((a, b) => b.count - a.count);

  var gameState = {
    players: players,
    scores,
    board: board.map(function (card) {
      card.found = card.temp === false;
      if (card.playerId) return card;
      return null;
    })
  };

  return gameState;
}

function readIcons(cb) {
  require('fs').readFile('data/all-icons.txt', 'utf-8', function (err, content) {
    if (err) {
      console.log('Cannot load icons: ', err);
      cb(err);
    }
    cb(null, content.split('\n'));
  });
}
