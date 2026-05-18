'use strict';

angular.module('angularApp').directive('onBottomAlmostVisible', [ '$window',
    function onBottomAlmostVisible($window) {
      return {
        restrict: 'A',
        link: function(scope, element, attributes) {
          var threshold = parseInt(attributes['almostInPixels']) || 200;

          angular.element($window).bind('scroll load', _.debounce(function() {
            var rect = element[0].getBoundingClientRect();
            if((rect.bottom + threshold) < (window.innerHeight + window.scrollY)) {
              scope.$eval(attributes['onBottomAlmostVisible']);
            }
          }, 200));
          scope.$on("$destroy", function(){
            angular.element($window).unbind('scroll load');
          });
        }
      };
    }
]);

