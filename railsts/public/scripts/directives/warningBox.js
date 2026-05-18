'use strict';

angular.module('angularApp')
.directive('warningBox', function(){
  return {
    templateUrl: 'views/_warningBox.html',
    restrict: 'E',
    replace: true,
    scope: {},
    controller: function($scope, currentUser){

      $scope.isLoggedIn = currentUser.user !== null;
      $scope.currentUser = null;

      $scope.$watch(function(){
        return currentUser.user;
      }, function(user){
        $scope.currentUser = user;
        $scope.isLoggedIn = user !== null;
      }, true);

      $scope.capitalise = function(string) {
        if(!(string == undefined || string == "")) {
          return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
        } else {
          return ""
        }
      }

    }
  }
});
