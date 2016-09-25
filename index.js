var mapHeight = 5;
var mapWidth = 10;

var express, app, http, io;
var sockets = [];
var icons;
var tiles = [];

readIcons(function(err, _icons) {
  if (err) return;
  icons = _icons;
  initTiles();
  setupExpress();
});


function initTiles() {
  var numIconsToUse = mapWidth * mapHeight / 2;
  var iconsToUse = [];
  for (var k = 0; k < numIconsToUse; ++k) {
    iconsToUse.push([getRandomIcon(), 2]);
  }
  
  for (var i = 0; i < mapWidth; ++i) {
    for (var j = 0; j < mapHeight; ++j) {
      var idx = Math.floor(Math.random() * Object.keys(iconsToUse).length);
      var o = iconsToUse[idx];
      if (--o[1] == 0) {
        iconsToUse.splice(idx, 1);
      }
      if (!tiles[i]) {
        tiles[i] = [];
      }
      tiles[i].push(o[0]);
    }
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

   io.on('connection', function (socket) {
     sockets.push(socket);
     socket.playerName = 'Player ' + Math.floor(Math.random() * 10000);
     console.log('User connected');
     sendGameState(socket);
     
     socket.on('send-info', function(data) {
       socket.playerName = data.name;
     })
     
     socket.on('disconnect', function () {
       var idx = sockets.indexOf(socket);
       if (idx != -1) sockets.splice(sockets, 1)
       console.log(' User disconnected');
     });
   });
}

function broadcast() {
  for (var i = 0; i < sockets.length; ++i) {
    sendGameState(sockets[i]);
  };
}

function sendGameState(socket) {
  socket.emit('game-state', {
    numPlayers: sockets.length,
    players: sockets.map(function(s) { return { name: s.playerName }})
  });  
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
