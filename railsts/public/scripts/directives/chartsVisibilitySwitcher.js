'use strict';

angular.module('angularApp').directive('chartsVisibilitySwitcher', ['confirmUnsavedChanges', function(confirmUnsavedChanges) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      showStatus: '='
    },
    template: "<div class='charts-visibility-switcher'><span class='greyed smaller' ng-transclude></span> <ts-switcher ng-model='switchStatus'></ts-switcher></div>",
    controller: function($scope){
      confirmUnsavedChanges($scope);

      $scope.showStatus = $scope.showStatus || false;
      $scope.switchStatus = $scope.showStatus || undefined;
      $scope.$watch('switchStatus', function(_switch, old){
        if(!(_switch === undefined)){
          if($scope.showStatus != _switch && $scope.preventLossOfChanges('filter')){
            $scope.switchStatus = old;
          } else {
            $scope.showStatus = _switch;
          }
        }
      });

      $scope.$watch('showStatus', function (_switch, old) {
        if (!(_switch === undefined)) {
          $scope.switchStatus = _switch;
        }
      });
    }
  };
}]);
