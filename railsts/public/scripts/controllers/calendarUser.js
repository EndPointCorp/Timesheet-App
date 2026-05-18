'use strict';

angular.module('angularApp')
  .controller('CalendarUserCtrl', function ($scope, $location, $routeParams, currentUser, team, calendarUser) {
    $scope.days = [];
    $scope.currentUser = currentUser.user;
    $scope.isUserView = true;
    $scope.calendarUser = null;

    if ($routeParams['year']) {
      $scope.date = new Date($routeParams['year'], parseInt($routeParams['month'], 10) - 1, 1);
    } else {
      $scope.date = new Date();
    }

    if ($routeParams['username']) {
      $scope.calendarUser = $routeParams['username'];
    }

    /**
     * Redirect to a different location on date changes
     * @param  {Date} date
     * @return {undefined}
     */
    $scope.redirectTo = function (date) {
      var redirect = function () {
        $location.url('/calendar-user/' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + $scope.calendarUser);
      };
      if ($routeParams['year']) {
        if (parseInt($routeParams['year'], 10) !== date.getFullYear() || (parseInt($routeParams['month'], 10) - 1) !== date.getMonth()) {
          redirect();
        }
      } else {
        var today = new Date();
        if (today.getFullYear() !== date.getFullYear() || today.getMonth() !== date.getMonth()) {
          redirect();
        }
      }
    };

    $scope.$watch('date', function (date) {
      if (date) {
        $scope.redirectTo(date);
      }
    }, true);

    $scope.$watch(function () {
      return currentUser.user;
    }, function (user) {
      $scope.currentUser = user;
    }, true);

    /**
     * Load a list of users and store in the sessionStorage to avoid
     * reloading on the location change
     */
    $scope.$watch(function () {
      return $scope.currentUser;
    }, function (n, o) {
      if (n !== null) {
        if (calendarUser.possibleUsers === null || calendarUser.fetchedUsersFor === null || calendarUser.fetchedUsersFor.code != $scope.currentUser.code) {
          calendarUser.getUsers()
            .then(function (users) {
              $scope.possibleUsers = users;
            });
        } else {
          $scope.possibleUsers = calendarUser.possibleUsers;
        }

        $scope.calendarUser = $scope.calendarUser || $scope.currentUser.code.split('_')[1];
      }
    });

    $scope.$watch('calendarUser', function (username) {
      if (username) {
        $location.url('/calendar-user/' + $scope.date.getFullYear() + '/' + ($scope.date.getMonth() + 1) + '/' + username);
      }
    });
  });
