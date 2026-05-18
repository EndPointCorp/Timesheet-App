'use strict';

angular.module('angularApp')
  .controller('WorkEntryCtrl', function($scope, $location, $timeout, $routeParams, workEntries, gToast, history, workCharts, $window, hoursInTheBank, currentUser){
    $scope.chart = null;
    $scope.description = "";
    $scope.durations = [];
    $scope.notValid = true;
    $scope.fee_string = "$0.00";
    $scope.showHiddenCharts = false;
    $scope.showHiddenStatus= false;
    $scope.project = null;
    $scope.hoursBusy = false;
    $scope.hoursWaiting = false;
    $scope.entry = {};
    $scope.currentUser = currentUser.user;

    $scope.cancel = function(event){
      history.back();
    };

    $scope.save = function(event){
      history.back();
    };

    $window.onbeforeunload = function () {
      if ($location.$$path.indexOf('entries') !== -1 && ($location.$$path.indexOf('new') !== -1 || $location.$$path.indexOf('edit') !== -1)) {
        return 'You can lose your data.';
      }
    };

    $scope.$watch(function () {
      return currentUser.user;
    }, function (user) {
      $scope.currentUser = user;
    }, true);
  });
