(function() {
  'use strict';
  /*global io, angular, google, moment*/

  var socket, app;

  socket = io({
    transports: ['websocket'],
    upgrade: false,
    log: true
  });

  socket.on('connect', function() {
    console.log('connected');
    socket.emit('send-info', {
      'name': 'pouya'
    });
    socket.on('game-state', function(game) {
      console.log('game', game);
    });
  });

  var Card = function(socket, data) {
    this.socket = socket;
    this.data = data;
  };

  Card.prototype.click = function() {
    this.socket.emit('card_click', this.data.id);
    console.log('click');
  };

  app = angular.module('myApp', []);
  // app.directive('singlePokemon', function() {
  //   return {
  //     restrict: 'A',
  //     templateUrl: '/templates/single.pokemon.ng.html'
  //   };
  // });


  app.controller('MainController', function($scope, $http, $rootScope) {
    var o, i;
    o = {
      count: 3,
      list: []
    };
    for (i = 0; i < o.count * o.count; i += 1) {
      o.list.push(new Card(socket, {
        id: i,
        code: 'braille'
      }));
    }
    o.percentage = 100 / o.count;
    o.width_container = 100 * o.count;

    $scope.o = o;
  });



}());
