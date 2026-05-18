'use strict';

angular.module('angularApp').
  controller('SwitchRoleCtrl', function($scope, $location, currentUser, $routeParams){
    $scope.allRoles = [];
    $scope.roles = [];
    $scope.showAll = false;
    $scope.switchTo = function(role){
      currentUser.switchTo(role).then(function(){
        localStorage['lastEntryCalendarMonth'] = (new Date()).toJSON();
        $location.url($routeParams.ret || "/");
      });
    };
    var filterRoles = function(){
      if($scope.showAll){
        $scope.roles = $scope.allRoles;
      }
      else{
        $scope.roles = Lazy($scope.allRoles).filter(function(r){
          return r.status_code == 'enabled';
        }).toArray();
      }
    };
    $scope.$watch('showAll', filterRoles);
    $scope.$watch('allRoles', filterRoles);
    currentUser.getSwitchableRoles().then(function(roles){
      $scope.allRoles = Lazy(roles.data).map(function(role){
        var r = role;
        r.name = Lazy(r.display_label).drop(6).join('');
        return r;
      }).toArray();
    });
  });
