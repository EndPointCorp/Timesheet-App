'use strict';

angular.module('angularApp').directive('tsVisible', function($window){
  return {
    restrict: 'A',
    scope: {
      visible: '=tsVisible'
    },
    link: function(scope, elem, attr, ctrl) {
      scope.$watch(function(){
        return scope.visible;
      }, function(v){
        var vis = 'visible';
        if(v == false) vis = 'hidden';
        elem[0].style.visibility = vis;
      });  

    }
  }
});

