(function() {
  'use strict';
  /*global io, angular, google, moment*/

  var socket, app;

  socket = io({
    transports: ['websocket'],
    upgrade: false,
    log: true
  });


  socket.on('user-new-position', function() {});


  app = angular.module('myApp', []);
  app.directive('singlePokemon', function() {
    return {
      restrict: 'A',
      templateUrl: '/templates/single.pokemon.ng.html'
    };
  });


  app.controller('MainController', function($scope, $http, $rootScope) {
    var o, i;
    o = {
      count: 3,
      list: []
    };
    for (i = 0; i < o.count * o.count; i += 1) {
      o.list.push({
        id: i
      });
    }
    o.percentage = 100 / o.count;
    $scope.o = o;
  });



}());
