'use strict';

angular.module('angularApp')
  .directive('cronSpec', [ 'calendar', function (calendar) {
    return {
      templateUrl: 'views/_cronSpec.html',
      require: 'ngModel',
      restrict: 'E',
      replace: true,
      link: function(scope, elem, attrs, ngModelCtrl){
        scope.setIsEmpty = function(){
          if(scope.spec === null || scope.spec === undefined || scope.isEditable != false){
            return scope.isEmptyConst = !scope.isEditable;
          }
          scope.isEmptyConst = Lazy(scope.spec).values().every(function(v){
            return v === null || v === undefined;
          });
        };

        attrs.$observe('edit', function(edit){
          scope.isEditable = edit == true || edit == "true";
          scope.setIsEmpty();
        });

        ngModelCtrl.$render = function(){
          scope.spec = ngModelCtrl.$modelValue;
          if(scope.spec !== null && scope.spec !== undefined) {
            scope.recurMonthly = Object.values(scope.spec).filter(v => v !== null && v !== undefined).length > 0;
          } else {
            scope.spec = {};
          }
          scope.setIsEmpty();
        }; 

        scope.$watch('recurMonthly', function(recurMonthly, previous) {
          if(previous === undefined) {
            return;
          }

          if(recurMonthly) {
            scope.spec = {day_of_month: 1, day_of_week: null, hours: 0, minutes: 0, month: null, year: null};
          } else {
            scope.spec = {};
          }

          ngModelCtrl.$setViewValue(scope.spec);
        });
      }
    }
  }]);

