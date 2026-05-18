'use strict';

angular.module('angularApp')
  .directive('buttoner', function(){
    return {
      templateUrl: 'views/_buttoner.html',
      restrict: 'E',
      transclude: true,
      replace: true,
      scope: {
        selectedItem: "=selectedItem",
        isItem: "=isDefaultItem",
        title: "=title",
        labelAttribute: "@labelAttribute",
        generalItems: "=generalItems" 
      },
      controller: ["$scope", "currentUser", function($scope, currentUser){
        $scope.selectedItem = "";
        $scope.selectedItemTitle = "";

        if($scope.labelAttribute === undefined || $scope.labelAttribute === null || $scope.labelAttribute == ""){
          $scope.labelAttribute = "label";
        }

        $scope.isLoggedIn = currentUser.user !== null;
        $scope.currentUser = currentUser.user 

        $scope.$watch(function(){
          return currentUser.user;
        }, function(user){
          if (user != null) {
            $scope.currentUser = user;
            $scope.isLoggedIn = user !== null;
          }
        }, true);

        $scope.$watch('isItem', function(){
          $scope.isDefaultItem = $scope.isItem
        });

        $scope.getLabel = function(item) {
          return item[$scope.labelAttribute];
        };

        $scope.selectItem= function(item){
          $scope.isDefaultItem = false;
          if($scope.selectedItem != "" && $scope.selectedItem !== null && $scope.selectItem !== undefined && item.code === $scope.selectedItem.code) {
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
          return $scope.selectedItem !== "" && $scope.selectedItem !== null && $scope.selectedItem !== undefined && $scope.selectedItem.code === item.code;
        };
      }
    ]}
  });
