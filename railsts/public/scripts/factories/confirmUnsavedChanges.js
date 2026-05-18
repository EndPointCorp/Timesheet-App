'use strict';

angular.module('angularApp')
  .factory('confirmUnsavedChanges', function confirmUnsavedChangesFactory() {
    return function(scope) {

      scope.selector = '.apply-changes-item:not(.ng-hide)';

      scope.unsavedItems = function () {
        return angular.element('.apply-changes-item:not(.ng-hide)').length > 0;
      };

      scope.clearChanges = function () {
        angular.element('.apply-changes-item:not(.ng-hide)[ng-click*=cancelChanges]').click();
        return true;
      };

      scope.confirmLoseChanges = function (message_type) {
        var message = "You will lose your changes, are you sure you want to navigate away?";
        if (message_type == "filter") {
          message = "You could lose your changes, are you sure you want to apply this filter?";
        }
        return (confirm(message));
      };

      scope.preventLossOfChanges = function (message_type) {
         return scope.unsavedItems() && !scope.confirmLoseChanges(message_type);
      };

      scope.confirmChangeHandler = function () {
        return !scope.preventLossOfChanges('filter');
      };
    };
  });
