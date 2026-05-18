'use strict';

angular.module('angularApp').directive('toggleStatusSwitcher', function() {
  return {
    restrict: 'AE',
    scope: {
      toggleStatus: '='
    },
    template: "<div class=\"switch\" ng-class=\"{\'switch-left\': !toggleStatus, \'switch-right\': toggleStatus}\" ng-model='toggleStatus' ng-click=\"toggleStatus = !toggleStatus\">\n  <div class=\"switch-button\">&nbsp;</div>\n</div>",
    link: function(scope, element, attrs, ngModel) {
      var isEnabled = true;


      scope.toggle = function toggle() {
        if(isEnabled) {
          scope.toggleStatus = !scope.toggleStatus;
          isEnabled = false;
        } else {
          isEnabled = true;
        }
      };
    }
  };
});


