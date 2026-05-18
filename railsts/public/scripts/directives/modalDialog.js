'use strict';

angular.module('angularApp').directive('modalDialog', function() {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      show: '='
    },
    replace: true,
    templateUrl: 'views/_modalDialog.html',
    link: function(scope, element, attrs) {
      scope.dialogStyle = {};
      scope.selectedValue = "myteam";

      scope.$watch('show', function(isShown) {

      });

      scope.hideModal = function() {
        scope.show = false;
      };
    }
  };
});
