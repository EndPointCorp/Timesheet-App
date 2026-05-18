'use strict';

angular.module('angularApp')
  .directive('teams', function(team){
    return {
      templateUrl: 'views/_teams.html',
      restrict: 'E',
      transclude: true,
      replace: true,
      scope: {
        selectedItem: "=selectedItem",
        isItem: "=isDefaultItem",
        title: "=title",
        generalItems: "=generalItems" 
      },
      controller: ["$scope", "currentUser", function($scope, currentUser){
        $scope.selectedItem = "";
        $scope.selectedItemTitle = "";

        $scope.isLoggedIn = currentUser.user !== null;
        $scope.currentUser = currentUser.user 

        $scope.$watch(function(){
          return currentUser.user;
        }, function(user) {
          if (currentUser.user !== null) {
            $scope.currentUser = currentUser.user;
            $scope.isLoggedIn = currentUser.user !== null;
          }
        }, true);

        $scope.$watch('isItem', function(){
          $scope.isDefaultItem = $scope.isItem
        });

        $scope.selectItem= function(item){
          $scope.isDefaultItem = false;
          if($scope.selectedItem != "" && item.code === $scope.selectedItem.code) {
            $scope.selectedItem = "";
            $scope.selectedItemTitle = "";
          } else {
            Lazy($scope.generalItems).each(function(r){
              r.is_active = r.code === item.code;
              if (r.is_active){ 
                $scope.selectedItem = item;
                $scope.selectedItemTitle = item.label;
              }
            });
          }
        };

        $scope.isSelectedItem = function(item) {
          if($scope.isDefaultItem) {
            $scope.selectDefaultItem();
          }
          return $scope.selectedItem.code === item.code;
        }

        $scope.selectDefaultItem= function(){
          if(!$scope.currentUser.is_director && $scope.currentUser.is_manager) {
            Lazy($scope.generalItems).each(function(r){
              r.is_active = r.manager === $scope.currentUser.email;
              if (r.is_active){ 
                $scope.selectedItem = r;
                $scope.selectedItemTitle = r.label;
              }
            });
          } 
        }
      }
    ]}
  });
