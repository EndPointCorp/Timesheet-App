'use strict';

angular.module('angularApp')
.directive('calendar', function () {
  return {
    templateUrl: 'views/_calendar.html',
    restrict: 'E',
    replace: true,
    scope: {
      date: '=date',
      isUserView: '=isUserView',
      calendarUser: '=calendarUser'
    },
    controller: function ($scope, calendar, $location, dailyHoursFilter) {
      var year = $scope.date.getFullYear();
      var month = $scope.date.getMonth();

      $scope.goTo = function (entry) {
        if ($scope.isUserView === true) {
          return;
        }

        var entryDate = new Date(entry.date);
        $location.url('/entries/' + entryDate.getFullYear() + '/' + (entryDate.getMonth() + 1) + '/' + entryDate.getDate());
      };

      var weekForDate = function (d) {
        if ((d.getMonth() < month && d.getFullYear() === year) || d.getFullYear() < year) {
          return 1;
        } else {
          if (d.getMonth() > month || d.getFullYear() > year) {
            var _date = new Date(year, month + 1, 0);

            return Math.ceil((_date.getDate() + (new Date(year, month, 1).getDay())) / 7);
          } else {
            return Math.ceil((d.getDate() + (new Date(year, month, 1).getDay())) / 7);
          }
        }
      };

      var refreshTotals = function (days) {
        var now = new Date();

        $scope.weekTotals = Lazy(days).groupBy(function (d) {
          return d.week;
        }).values()
          .map(function (days) {
            var total = {
              futureWeek: true,
              lastDay: Lazy(days).last(),
              week: days[0].week,
              total: Lazy(days).map(function (day) { return day.total; }).sum(),
              totalBillable: Lazy(days).map(function (day) { return day.totalBillable; }).sum(),
              totalNonbillable: Lazy(days).map(function (day) { return day.totalNonbillable; }).sum(),
              totalPto: Lazy(days).map(function (day) { return day.totalPto; }).sum()
            };
            total.class = '';
            var dayDifference = (total.lastDay.date - now) / (1000 * 60 * 60 * 24);
            if (dayDifference > 7) {
              total.futureWeek = true;
            } else {
              total.futureWeek = false;
              if (dayDifference < 7 && dayDifference > 0) {
                total.class += ' total-thisweek';
              } else {
                if (total.total >= 40) {
                  total.class += ' total-ok';
                } else {
                  total.class += ' total-little';
                }
              }
            }

            return total;
          }).toArray();
      };

      $scope.days = calendar.cachedDays($scope.date.getFullYear(), $scope.date.getMonth() + 1);
      refreshTotals($scope.days);
      calendar.getDays($scope.date.getFullYear(), $scope.date.getMonth() + 1, $scope.calendarUser)
        .then(function (res) {
          var days = res.data;
          $scope.days = Lazy(days).map(function (day) {
            var d = day;
            var now = new Date();
            var dArray = d.date.split('-');
            d.date = new Date(dArray[0], parseInt(dArray[1], 10) - 1, dArray[2]);
            d.total = d.time / 60;
            d.totalBillable = d.billable_time / 60;
            d.totalNonbillable = d.nonbillable_time / 60;
            d.totalPto = d.pto_time / 60;
            d.day = d.date.getDate();
            d.week = weekForDate(d.date);
            d.inFuture = (new Date(d.date.getFullYear(), d.date.getMonth(), d.date.getDate())) >
            (new Date(now.getFullYear(), now.getMonth(), now.getDate()));
            d.class = ' day-' + d.date.getDay();
            d.class += ' week-' + weekForDate(d.date);
            if (d.date.getMonth() !== $scope.date.getMonth()) {
              d.class += ' out-of-month';
            }
            d.class += ' ' + dailyHoursFilter(d.total, d.date, now);
            return d;
          }).toArray();

          refreshTotals($scope.days);
        });
    }
  };
});
