'use strict';

angular.module('angularApp')
  .directive('ptoTotals', function () {
    return {
      templateUrl: 'views/_ptoTotals.html',
      restrict: 'E',
      replace: true,
      scope: {
        date: '=date',
        calendarUser: '=calendarUser'
      },
      controller: function ($scope, $http, currentUser) {
        $scope.holidays = 0;
        $scope.sicks = 0;
        $scope.vacations = 0;
        $scope.last_holidays = 0;
        $scope.last_sicks = 0;
        $scope.last_vacations = 0;
        $scope.anniversary = '';
        $scope.currentYear = (new Date()).getFullYear();
        $scope.lastYear = (new Date()).getFullYear() - 1;

        var updatePtos = function (ptos) {
          if (ptos === null || ptos === undefined) {
            return;
          }

          $scope.anniversary = ptos.anniversary || '';
          $scope.holidays = ptos.holiday || 0;
          $scope.sicks = ptos.sicks || 0;
          $scope.vacations = ptos.vacations || 0;
          $scope.last_holidays = ptos.last_year_holiday || 0;
          $scope.last_sicks = ptos.last_year_sicks || 0;
          $scope.last_vacations = ptos.last_year_vacation || 0;
          $scope.currentAniversaryYear = ptos.last_aniversary_year;
          $scope.lastAniversaryYear = ptos.last_aniversary_year - 1;
          $scope.currentYear = ptos.cal_year;
          if($scope.currentYear === null || $scope.currentYear === undefined) {
            $scope.currentYear = ptos.calYear;
          }
          $scope.lastYear = ptos.last_cal_year;
          if($scope.lastYear === null || $scope.lastYear === undefined) {
            $scope.lastYear = ptos.lastCalYear;
          }
        };

        $scope.$watch('ptos', updatePtos);
        $scope.ptos = currentUser.cachedPtos();

        if (typeof $scope.calendarUser === 'undefined' || $scope.calendarUser === null) {
          var ptosUrl = '/ptos';
        } else {
          var ptosUrl = '/ptos/' + $scope.calendarUser;
        }

        $http.get(ptosUrl).success(function (res) {
          updatePtos(res);
        });
      }
    };
  });
