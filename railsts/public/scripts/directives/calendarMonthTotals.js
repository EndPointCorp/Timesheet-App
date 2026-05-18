'use strict';

angular.module('angularApp').
  directive('calendarMonthTotals', function () {
    return {
      templateUrl: 'views/_calendarMonthTotals.html',
      restrict: 'E',
      replace: true,
      scope: {
        date: '=date',
        isUserView: '=isUserView',
        calendarUser: '=calendarUser'
      },
      controller: function ($scope, $location, calendar, currentUser) {
        $scope.months = calendar.cachedMonthTotals($scope.date);

        $scope.$watch(function () {
          return currentUser.user;
        }, function (user) {
          if (user !== null && user !== undefined && user !== '') {
            calendar.getMonthTotals($scope.date, $scope.calendarUser).then(function (totals) {
              $scope.months = totals.data;
            });
          }
        });

        $scope.goTo = function (m) {
          if (typeof $scope.isUserView !== 'undefined' && $scope.isUserView === true) {
            $location.url('/calendar-user/' + m.year + '/' + m.month + '/' + $scope.calendarUser);
          } else {
            $location.url('/calendar/' + m.year + '/' + m.month);
          }
        };
      }
    };
  });
