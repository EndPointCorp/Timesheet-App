'use strict';

angular.module('angularApp')
  .controller('CreateGroupCtrl', function ($scope, gToast, $location, groups, hotkeys) {
    $scope.fieldFocused = true;
    $scope.label = "";
    $scope.code = "";
    $scope.description = "";
    $scope.msgClass = "";
    $scope.showMsg = false;
    $scope.msg = "";
    $scope.$watch('label', function () {
      generateCode();
    });

    var generateCode = function () {
      $scope.code = $scope.label.toLowerCase().trim().replace(/\s/g, '_').replace(/[\:\.]+/g, "");
    }

    $scope.createGroup = function () {
      if ($scope.label !== "" && $scope.description !== "") {
        if ($scope.code === "") {
          generateCode();
        }

        if ($scope.showMsg) {
          $scope.showMsg = false;
        }

        groups.createGroup($scope.label, $scope.code, $scope.description)
          .then(function (resp) {
          gToast.open("Group created!", {theme: "groupCreated"});

          setTimeout(function () {
            $location.path('/groups-editor');
          }, 1500);

          if ($scope.showMsg) {
            $scope.showMsg = false;
          }
        }, function (resp) {
          $scope.msgClass = "errorMsg";
          $scope.msg = String(Lazy(resp.errors).uniq().join(', '));
          $scope.showMsg = true;
        });

        console.log("Created group:" + $scope.label + ":" + $scope.code + ":" + $scope.description);
      } else {
        if ($scope.label === "") {
          $scope.msg = "Missing group name \n";
        } else if ($scope.description === "") {
          $scope.msg = "Missing description \n";
        } else {
          $scope.msg = ""
        }

        if ($scope.msg === "") {
          $scope.showMsg = false;
        } else {
          $scope.showMsg = true;
        }

        $scope.msgClass = "errorMsg";
      }
    };

    // hotkeys initialization
    hotkeys.bindTo($scope).add({
      combo: 'enter',
      description: 'Save the group',
      allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
      callback: function () {
        $scope.createGroup();
      }
    });
  });
