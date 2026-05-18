'use strict';

angular.module('angularApp')
  .directive('transactionPreview', function (appVersion) {
    return {
      templateUrl: 'views/_transactionPreview.html?v=' + appVersion.frontend,
      restrict: 'E',
      replace: true,
      scope: {
        transaction: '=',
        onDelete: '&',
        onUpdate: '&'
      },
      controller: ['$scope', '$filter', '$window', 'transactions', function ($scope, $filter, $window, transactions){
        $scope.editing = false;

        $scope.endDate = function(){
          if($scope.transaction.date_closed !== null && $scope.transaction.date_closed !== undefined){
            return $scope.transaction.date_closed;
          }
          return "Now";
        };

        $scope.modeString = function(){
          return $scope.transaction.mode == "billable" ? "Billables" : "Nonbillables";
        };

        $scope.recurModeString = function() {
          return $scope.transaction.recur_mode == "cumulative" ? "Cumulative" : "Zeroing out";
        };

        $scope.baselineString = function(){
          return $scope.transaction.is_baseline ? "Yes" : "No";
        };

        $scope.recursString = function(){
          return $scope.transaction.recur_every === null ? "Never" :
            $scope.transaction.recur_every;
        };

        $scope.hasDescription = function(){
          return $scope.transaction.description !== "";
        };

        $scope.descriptionString = function(){
          return $scope.transaction.description === "" ? "No description provided" :
            $scope.transaction.description;
        };

        $scope.edit = function(){
          $scope.editing = true;
        };

        $scope.delete = function(){
          var confirmed = $window.confirm('Are you sure?');

          if (confirmed === true) {
            transactions.deleteTransaction($scope.transaction.id).then(function(){
              $scope.onDelete();
            });
          }
        };

      }]
    };
  });

