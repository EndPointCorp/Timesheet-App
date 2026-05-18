'use strict';

angular.module('angularApp').directive('tsHelp', function() {
  return {
    restrict: 'E',
    templateUrl: 'views/_tsHelp.html',
    replace: true,
    transclude: true,
    scope: {
      title: "@"
    },
    controller: function($scope){
      $scope.showTip = false;
    }
  }
});



