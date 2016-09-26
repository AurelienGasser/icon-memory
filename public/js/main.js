(function() {
  'use strict';
  /*global io, angular, google, moment*/

  var socket, app, game, Game, Card, $emit, $on;
  Game = function(socket) {
    this.socket = socket;
    this.cards = null;
  };

  Game.prototype.updateBoard = function() {
    var i;
    if (this.cards === null) {
      this.cards = {};
      for (i = 0; i < this.gameState.board.length; i += 1) {
        this.cards[i] = new Card(this, {
          id: i,
          icon: null,
          player: null
        });
      }
    } else {
      // for (i = 0; i < this.gameState.board.length; i += 1) {
      //   this.cards[i].data = this.gameState.board[i];
      // }
    }
    console.log(this.cards);
  };

  Game.prototype.setGameState = function(gameState) {
    var count = Math.sqrt(gameState.board.length);
    game.ui = {
      percentage: 100 / count,
      widthContainer: 100 * count
    };
    this.gameState = gameState;
    this.updateBoard();
  };

  socket = io({
    transports: ['websocket'],
    upgrade: false,
    log: true
  });

  game = new Game(socket);



  Card = function(socket, data) {
    this.socket = socket;
    this.data = data;
    this.animate = false;
  };

  Card.prototype.click = function() {
    var that = this;
    // that.data.icon = 'braille';
    console.log(that.data);
    $emit('card-turn', that.data, function(card) {
      console.log('card-turn', card);
      that.data.icon = card.icon;
      that.animate = true;
    });
    console.log('click');
  };

  app = angular.module('myApp', []);
  app.controller('MainController', function($scope) {

    game.$s = $scope;
    $scope.game = game;

    $on = function(key, callback) {
      socket.on(key, function(res) {
        $scope.$apply(function() {
          return callback(res);
        });
      });
    };
    $emit = function(key, data, callback) {
      socket.emit(key, data, function(res) {
        $scope.$apply(function() {
          return callback && callback(res);
        });
      });
    };

    socket.on('connect', function() {
      console.log('connected');
      socket.emit('send-info', {
        'name': 'pouya'
      });
      $on('game-state', function(gameState) {
        game.setGameState(gameState);
        console.log('gameState', gameState);
      });
    });

  });



}());
