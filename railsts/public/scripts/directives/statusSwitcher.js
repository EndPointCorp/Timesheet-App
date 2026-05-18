'use strict';

angular.module('angularApp').directive('statusSwitcher', function() {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      switcherStatus: "=switcherUserStatus",
      switcherChange: "=statusChange"
    },
    template: "<div class=\"switch\" ng-class=\"{\'switch-left\': !switcherStatus, \'switch-right\': switcherStatus}\" ng-click=\"toggleStatus()\">\n  <div class=\"switch-button\">&nbsp;</div>\n</div>",
    controller: function($scope, workCharts){
      var isToggled = false;
      $scope.$watch('switcherStatus', function(_switch){
        if(isToggled) {
          $scope.switcherChange();
          isToggled = false;
        }
      });
      $scope.toggleStatus = function() {
        $scope.switcherStatus = !$scope.switcherStatus;
        isToggled = true;
      };
    }
  };
});



