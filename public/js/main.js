(function() {
  'use strict';
  /*global io, angular, google, moment*/

  var socket, app, game, Game, Card, $emit, $on;
  Game = function(socket) {
    this.socket = socket;
    this.cards = null;
    this.player = {
      name: localStorage.iconMemoryName || 'player' + Math.random(10),
      color: localStorage.iconMemoryColor || '#ff00ff'
    };
  };

  Game.prototype.savePlayer = function() {
    localStorage.iconMemoryName = this.player.name;
    localStorage.iconMemoryColor = this.player.color;
    socket.emit('send-info', this.player);
  };

  Game.prototype.updateBoard = function() {
    var i, c, card;
    if (this.cards === null) {
      this.cards = {};
      for (i = 0; i < this.gameState.board.length; i += 1) {
        c = this.gameState.board[i];
        card = {
          id: i,
          icon: c && c.icon || null,
          player: c && c.player || null
        };
        this.cards[i] = new Card(this, card);
      }
    } else {
      console.log(this.gameState.board);
      for (i = 0; i < this.gameState.board.length; i += 1) {
        c = this.gameState.board[i];
        if (c !== null) {
          this.cards[i].data.icon = this.gameState.board[i].icon;
        } else {
          this.cards[i].data.icon = null;
        }
      }
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


  Card = function(game, data) {
    this.game = game;
    this.data = data;
  };

  Card.prototype.color = function() {
    var player = this.data.turn && game.gameState.player[this.data.turn];
    return player && player.color || '#ff00ff';
  };

  Card.prototype.click = function() {
    var that = this;
    // that.data.icon = 'braille';
    console.log(that.data);
    $emit('card-turn', that.data, function(card) {
      if (card === null) {
        return console.log('card is null');
      }
      console.log('card-turn', card);
      that.data.icon = card.icon;
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
      $on('game-state', function(gameState) {
        console.log('gameState', gameState);
        game.setGameState(gameState);
      });
    });

  });



}());
