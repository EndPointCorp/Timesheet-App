'use strict';

angular.module('angularApp')
  .factory('unsavedRoleChanges', ['confirmUnsavedChanges', function unsavedRoleChangesFactory(confirmUnsavedChanges) {
    return function(scope, $window) {
      confirmUnsavedChanges(scope);

      $window.onbeforeunload = function () {
        if(scope.unsavedItems()) {
          return 'You can lose your data.';
        }
      };

      scope.$on('$locationChangeStart', function(event, next, current) {
        if(scope.preventLossOfChanges()) {
          event.preventDefault();
        }
      });
    };
  }]);
