'use strict';

angular.module('angularApp')
  .directive('transactionForm', function () {
    return {
      templateUrl: 'views/_transactionForm.html',
      restrict: 'E',
      replace: true,
      scope: {
        transaction: '=?',
        workChart: '=?',
        onCancel: '&',
        onSave: '&'
      },
      controller: ['$scope', '$filter', 'transactions', function ($scope, $filter, transactions){
        var _clearTransaction = function(){
          $scope.transaction = {
            hours: '',
            description: '',
            date: $filter('date')(new Date(), 'yyyy-MM-dd'),
            mode: 'billable', recur_at: {}
          };
        };

        var _initialize = function() {
          $scope.isNew = $scope.transaction === undefined || $scope.transaction === null;

          $scope.$watch('transaction', function(transaction){
            $scope.workTransaction = _.clone($scope.transaction, true);

            if($scope.workTransaction !== null && $scope.workTransaction !== undefined &&
              ($scope.workTransaction.recur_at === null || $scope.workTransaction.recur_at === undefined)){
              $scope.workTransaction.recur_at = {};
            }
            $scope.originalTransaction = $scope.transaction;

            if($scope.workTransaction !== null && $scope.workTransaction !== undefined) {
              $scope.workTransaction.recur_mode_cumulative = $scope.workTransaction.recur_mode === 'cumulative';
            }

            if($scope.transaction === null || $scope.transaction === undefined) {
              _clearTransaction();
            }

          });

          $scope.$watch('[ workTransaction.recur_at.hours, workTransaction.recur_at.minutes, workTransaction.recur_at.day_of_month, workTransaction.recur_at.month, workTransaction.recur_at.day_of_week ]', function(parts) {
            if($scope.workTransaction !== null && $scope.workTransaction !== undefined) {
              $scope.showMode = parts.filter(function(i){
                return i !== null && i !== undefined;
              }).length > 0;
            }
          });
        }

        $scope.addTransaction = function() {
          return transactions.addTransaction(
              $scope.workTransaction.hours,
              $scope.workChart.id,
              $scope.workTransaction.date,
              $scope.workTransaction.date_closed,
              $scope.workTransaction.description,
              $scope.workTransaction.mode,
              $scope.workTransaction.recur_at,
              ($scope.workTransaction.recur_mode_cumulative ? 'cumulative' : 'zero-out')
          );
        };

        $scope.cancel = function(){
          if($scope.originalTransaction !== null && $scope.originalTransaction !== undefined){
            $scope.transaction = $scope.originalTransaction;
          }

          $scope.onCancel();
        };

        $scope.hoursAreValid = function() {
          return /^[-+]?[0-9]*\.?[0-9]*$/.test(String($scope.hours));
        };

        $scope.updateTransaction = function() {
          return transactions.updateTransaction($scope.workTransaction);
        };

        $scope.save = function(){
          var func = $scope.isNew ? $scope.addTransaction : $scope.updateTransaction;

          func().then(function(){
            $scope.onSave();
            _clearTransaction();
          });
        };

        _initialize();

      }]
    };
  });


