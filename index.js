var express, app, http, io, socket;
setupServer();

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

  io.on('connection', function(_socket) {
    socket = _socket;
    console.log('User connected');

    socket.on('disconnect', function() {
      console.log(' User disconnected');
    });
  });
}
