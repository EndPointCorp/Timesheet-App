angular.module('angularApp')
  .directive('reportApprovedCheck', function ($timeout) {
    return {
      restrict: 'A',
      scope: {
        hasNotApprovedEntries: '='
      },
      link: function (scope, elem, attr) {
        scope.$on('reportChangedAndLoaded', function () {
          scope.checkForNotApproved();
        });

        scope.checkForNotApproved = function () {
          $timeout(function () {
            if (elem.html().indexOf('heading not-approved') != -1) {
              scope.hasNotApprovedEntries = true;
            } else {
              scope.hasNotApprovedEntries = false;
            }
          });
        }
      }
    }
  });
