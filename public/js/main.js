(function() {
  'use strict';
  /*global io, angular, google, moment*/

  var socket, app, game, Game, Card, $emit, $on;
  Game = function(socket) {
    this.socket = socket;
    this.cards = null;
    this.player = localStorage.player || {
      playerName: 'player' + Math.random(10),
      color: '#ff00ff'
    };
  };

  Game.prototype.savePlayer = function() {
    localStorage.iconMemoryName = this.player.playerName;
    localStorage.iconMemoryColor = this.player.color;
    console.log('savePlayer', this.player);
    socket.emit('send-info', this.player);
  };

  Game.prototype.updateBoard = function() {
    var i, c, card;
    if (this.cards === null) {
      this.cards = {};
      for (i = 0; i < this.gameState.board.length; i += 1) {
        c = this.gameState.board[i];
        card = {
          cardId: i,
          icon: c && c.icon || null,
          playerId: c && c.playerId || null
        };
        this.cards[i] = new Card(this, card);
      }
    } else {
      console.log(this.gameState.board);
      for (i = 0; i < this.gameState.board.length; i += 1) {
        c = this.gameState.board[i];
        if (c !== null) {
          this.cards[i].data.icon = this.gameState.board[i].icon;
          this.cards[i].data.playerId = this.gameState.board[i].playerId;
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
    game.players = gameState.players;
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
  };

  Card.prototype.color = function() {
    var player = this.data.turn && game.gameState.player[this.data.playerId];
    console.log(player, this.data);
    return player && player.color || '#ff0000';
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
