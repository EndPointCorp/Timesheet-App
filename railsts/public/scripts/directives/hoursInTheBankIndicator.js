'use strict';

angular.module('angularApp').
  directive('hoursInTheBankIndicator', function(){
  return {
    templateUrl: 'views/_hoursInTheBankIndicator.html',
    restrict: 'E',
    replace: true,
    scope: {
    },
    controller: function($scope, $timeout, hoursInTheBank, $location, currentUser) {
      $scope.projects = [];
      $scope.waiting = true;
      $scope.busy = true;
      $scope.currentUser = currentUser;
      $scope.userCanEditWorkCharts = false;

      $timeout(function(){
        if($scope.waiting){
          $scope.busy = true;
        }
      }, 1000);

      hoursInTheBank.fetchSummary().then(function(projects){
        $scope.projects = projects;
        $scope.waiting = false;
        $scope.busy = false;
      });

      $scope.openClientTransactions = function (projectId) {
        if ($scope.userCanEditWorkCharts === true) {
          $location.url('/work_charts/editor/' + projectId + '/transactions');
        }
      }

      $scope.$watch(function () {
        return currentUser.user;
      }, function (user) {
        $scope.currentUser = user;

        if ($scope.currentUser && $scope.currentUser.can_edit_charts) {
          $scope.userCanEditWorkCharts = true;
        }
      }, true);
    }
  }
});
