'use strict';

angular.module('angularApp')
  .controller('CreateUserCtrl', function ($scope, gToast, currentUser, $location, $q, users, hotkeys) {
    $scope.fieldFocused = true;
    $scope.name = "";
    $scope.usermail = "";
    $scope.timeZones = [];
    $scope.selectedTimeZone = "US/Eastern"; 
    currentUser.getTimeZones().then(function (resp) {
      $scope.timeZones = resp.data;
    });
    $scope.password = "";
    $scope.passwordConfirmation = "";
    $scope.msgClass = "";
    $scope.showMsg = false;
    $scope.msg = "";
    $scope.teams = [];
    $scope.userTeams = [];

    $scope.createUser = function () {
      if ($scope.password == $scope.passwordConfirmation && $scope.startDate !== undefined) {
        users.createUser($scope.name, $scope.usermail, $scope.selectedTimeZone, $scope.password, $scope.startDate, $scope.userTeams)
          .then(function (resp) {
            if ($scope.showMsg) {
              $scope.showMsg = false;
            }

            gToast.open("User created!", {theme: "userCreated"});

            setTimeout(function () {
              $location.path('/users-editor');
            }, 1500);
          }, function (resp) {
            $scope.msgClass = "errorMsg";
            $scope.msg = String(Lazy(resp.message).uniq().join(', '));
            $scope.showMsg = true;
          });
      } else {
        if ($scope.startDate === undefined) {
          $scope.msg = "Missing joining date \n";
        }

        if ($scope.password !== $scope.passwordConfirmation) {
          $scope.msg = "Password does not match \n";
        }

        $scope.msgClass = "errorMsg";
        $scope.showMsg = true;
      }
    };

    $scope.loadInitialTeams = function () {
      currentUser.getAllTeams().then(function (teams) {
        $scope.teams = Lazy(teams.data).map(function (team) {
          var t = team;

          t.name = t.code.toLowerCase();

          return t;
        }).toArray();
      });
    };

    $scope.loadTeams = function (query) {
      var deferred = $q.defer();
      var items = [];

      for (var i = 0; i < $scope.teams.length; i++) {
        if ($scope.teams[i].name.indexOf(query) !== -1) {
          items.push($scope.teams[i]);
        }
      }

      deferred.resolve(items);

      return deferred.promise;
    };

    // checking current user permissions
    currentUser.refresh().then(function checkPermissions () {
      if (currentUser.user.can_create_users === false && currentUser.user.is_admin === false) {
        $location.url("/login");
      }
    });

    $scope.loadInitialTeams();

    // hotkeys initialization
    hotkeys.bindTo($scope)
      .add({
        combo: 'enter',
        description: 'Save the user',
        allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
        callback: function () {
          $scope.createUser();
        }
      });
  });
