'use strict';

angular.module('angularApp')
.directive('dateSwitcher', function(appVersion){
  return {
    templateUrl: 'views/_dateSwitcher.html?v=' + appVersion.frontend,
    restrict: 'E',
    replace: true,
    scope: {
      date: '=date',
      mode: '@',
      isUserView: '=isUserView',
      calendarUser: '=calendarUser',
      possibleUsers: '=possibleUsers'
    },
    controller: function($scope, hotkeys) {
      $scope.possibleYears = [];

      $scope.moveMonths = function (months) {
        var d = new Date($scope.date);
        if (months > 0) {
          d.setDate(1);
          d.setDate($scope.date.getDate() + (33 * months));
          d.setDate(1);
        } else {
          d.setDate(1);
          d.setDate(0);
          d.setDate(1);
        }
        $scope.moveToDate(d);
      };

      $scope.moveDays = function (days) {
        var d = new Date($scope.date);
        d.setDate($scope.date.getDate() + days);
        $scope.moveToDate(d);
      };

      $scope.moveToDate = function (d) {
        $scope.date = d;
      };

      $scope.$watch('chosenYear', function (y) {
        if (y == undefined) return;
        var d = new Date($scope.date);
        d.setFullYear(y);
        $scope.moveToDate(d);
      });

      $scope.$watch('chosenMonth', function (y) {
        if (y == undefined) return;
        var d = new Date($scope.date);
        d.setMonth(y - 1);
        $scope.moveToDate(d);
      });

      $scope.$watch('chosenDay', function (y) {
        if (y == undefined) return;
        var d = new Date($scope.date);
        d.setDate(y);
        $scope.moveToDate(d);
      });

      $scope.next = function () {
        if ($scope.mode !== 'months') {
          $scope.nextDay();
        } else {
          $scope.nextMonth();
        }
      };

      $scope.previous = function () {
        if ($scope.mode !== 'months') {
          $scope.previousDay();
        } else {
          $scope.previousMonth();
        }
      };

      $scope.nextDay = function () {
        $scope.moveDays(1);
      };

      $scope.previousDay = function () {
        $scope.moveDays(-1);
      };

      $scope.nextMonth = function () {
        $scope.moveMonths(1);
      };

      $scope.previousMonth = function () {
        $scope.moveMonths(-1);
      };

      $scope.$watch('date', function (date) {
        if (date == undefined || date == null) return;
        $scope.year = $scope.chosenYear = date.getFullYear();
        $scope.day = $scope.chosenDay = date.getDate();
        $scope.month = $scope.chosenMonth = date.getMonth() + 1;
        if (isNaN($scope.year) || isNaN($scope.month)) return;
        $scope.possibleDays = Lazy.range(1, 32 - new Date($scope.year, $scope.month - 1, 32).getDate() + 1).toArray();
      });

      var initDayName = function () {
        if ($scope.date == undefined || $scope.date == null) {
          return;
        }
        var weekday = new Array(7);
        weekday[0] = 'Sunday';
        weekday[1] = 'Monday';
        weekday[2] = 'Tuesday';
        weekday[3] = 'Wednesday';
        weekday[4] = 'Thursday';
        weekday[5] = 'Friday';
        weekday[6] = 'Saturday';
        $scope.dayName = weekday[$scope.date.getDay()];
      };

      $scope.$watch('date', function (date) {
        initDayName();
      });

      $scope.$watch('year', function (year) {
        $scope.possibleYears = Lazy.range(2002, (new Date()).getFullYear() + 2).toArray();
      });

      initDayName();

      // hotkeys initialization
      hotkeys.bindTo($scope)
        .add({
          combo: 'left',
          description: 'Go to the previous day/month',
          callback: function () {
            $scope.previous();
          }
        })
        .add({
          combo: 'right',
          description: 'Go to the next day/month',
          callback: function () {
            $scope.next();
          }
        });
    }
  };
});
