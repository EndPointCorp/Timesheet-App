'use strict';

angular.module('angularApp')
  .controller('MainCtrl', function ($scope, $location, $routeParams, history, currentUser) {
    $scope.days = [];
    $scope.currentUser = currentUser.user;
    $scope.isUserView = false;

    if($routeParams['year']){
      $scope.date = new Date($routeParams['year'], parseInt($routeParams['month'], 10) - 1, 1);
    }
    else{
      if(localStorage['lastEntryCalendarMonth']){
        try {
          var date = new Date(JSON.parse(localStorage['lastEntryCalendarMonth']));
          $scope.date = date;
        }
        catch(err) {
          localStorage.removeItem('lastEntryCalendarMonth');
          $scope.date = new Date();
        }
      }
      else{
        $scope.date = new Date();
      }
    }
    $scope.$watch('date', function(date){
      var redirect = function(){
        $location.url("/calendar/" + date.getFullYear() + "/" + (date.getMonth() + 1));
      };
      if($routeParams['year']){
        if(parseInt($routeParams['year'], 10) != date.getFullYear() || (parseInt($routeParams['month'], 10) - 1) != date.getMonth())
          redirect();
      }
      else {
        var today = new Date();
        if(today.getFullYear() != date.getFullYear() || today.getMonth() != date.getMonth()) redirect();
      }
    }, true);

    $scope.$watch(function () {
      return currentUser.user;
    }, function (user) {
      $scope.currentUser = user;
    }, true);
  });
