(function() {
  'use strict';
  /*global io, angular, google, moment*/

  var socket, app, game, Game, Card;


  Game = function(socket, gameState) {
    this.socket = socket;
    this.gameState = gameState || {
      board: []
    };
    this.initList();
  };

  Game.prototype.initList = function() {
    var i;
    for (i = 0; i < this.gameState.board.length; i += 1) {
      this.gameState.board.push(new Card(socket, {
        id: i,
        icon: null,
        player: null
      }));
    }
  };
  Game.prototype.setGameState = function() {
    var count = Math.sqrt(game.gameState.board.length);
    game.ui = {
      percentage: 100 / count,
      widthContainer: 100 * count
    };
  };

  socket = io({
    transports: ['websocket'],
    upgrade: false,
    log: true
  });

  game = new Game(socket);

  socket.on('connect', function() {
    console.log('connected');
    socket.emit('send-info', {
      'name': 'pouya'
    });
    socket.on('game-state', function(gameState) {
      game.gameState = gameState;
      console.log('gameState', gameState);
    });
  });

  Card = function(socket, data) {
    this.socket = socket;
    this.data = data;
  };

  Card.prototype.click = function() {
    var that = this;
    that.data.icon = 'braille';
    // this.socket.emit('card-turn', this.data.id, function(card) {
    //   that.data.icon = card.icon;
    // });
    console.log('click');
  };

  app = angular.module('myApp', []);
  app.controller('MainController', function($scope, $http, $rootScope) {
    game.$s = $scope;
    $scope.game = game;
  });



}());
