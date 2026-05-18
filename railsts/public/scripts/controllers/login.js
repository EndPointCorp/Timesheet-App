'use strict';

angular.module('angularApp')
  .controller('LoginCtrl', function ($scope, $location, currentUser, gToast, $timeout, $routeParams, $route, hotkeys) {
    if(currentUser.user !== null){
      $location.path($routeParams.ret || '/');
    }
    $scope.$route = $route;
    $scope.username = "";
    $scope.password = "";
    $scope.fieldFocused = true;

    $scope.tryLogIn = function(){
      currentUser.tryLogIn($scope.username, $scope.password)
        .then(function(data) {
          if (data.data.success === false) {
            gToast.open('Authentication failed. Invalid username or password.');
          } else {
            gToast.open('Logging in now, please wait.');
          }
        });
    };

    $scope.$watch(function(){
      return currentUser.user;
    }, function(n, o){
      if(n !== null){
        $location.url($routeParams.ret || "/");
      }
    });

    // hotkeys initialization
    hotkeys.bindTo($scope)
      .add({
        combo: 'enter',
        description: 'Log in',
        allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
        callback: function () {
          $scope.tryLogIn();
        }
      });
  });
