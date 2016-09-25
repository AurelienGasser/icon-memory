var express, app, http, io;
var sockets = [];
var icons;

readIcons(function(err, _icons) {
  if (err) return;
  icons = _icons;
  setupServer();
});

function setupServer() {
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
    console.log('User connected');

    socket.on('disconnect', function() {
      var idx = sockets.indexOf(socket);
      if (idx != -1) sockets.splice(sockets, 1)
      console.log(' User disconnected');
    });
  });
}

function broadcast() {
  for (var i = 0; i < sockets.length; ++i) {
    socket.emit('game_state', {
      numPlayers: sockets.length
    })
  };
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
