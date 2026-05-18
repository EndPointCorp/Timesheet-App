'use strict';

angular.module('angularApp').directive('wholeHeight', function($window){
  return {
    restrict: 'A',
    link: function(scope, elem, attr, ctrl) {
      scope.$watch(function(){
        return $window.innerHeight;
      }, function(v){
        elem[0].style.height = v + "px";
      });  

    }
  }
});
