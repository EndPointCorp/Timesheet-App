'use strict';

angular.module('angularApp')
  .directive('transactions', function () {
    return {
      templateUrl: 'views/_transactions.html',
      restrict: 'E',
      replace: false,
      scope: {
        workChart: '='
      },
      controller: ['$scope', '$http', 'transactions', 'currentUser', 'paginationService', '$filter', 
        function($scope, $http, transactions, currentUser, paginationService, $filter){

          var _initialize = function() {
            $scope.transactions = [];
            $scope.canDelete = currentUser.user.is_admin || currentUser.user.is_director;
            $scope.showNew = false;
          };

          $scope.refresh = function() {
            $scope.showNew = false;
            transactions.loadTransactions($scope.workChart.id)
              .then(function(transactions) {
                $scope.transactions = transactions.data;
              });
          };

          $scope.deleteTransaction = function(transaction) {
            transactions.deleteTransaction(transaction.id);
            $scope.transactions = Lazy($scope.transactions).filter(function(t){
              return t.id != transaction.id;
            }).toArray();
          };

          $scope.$watch("workChart.id", function(id){
            if(id !== undefined && id !== null){
              $scope.refresh();
            }
          });

          _initialize();
       }] // end of controller function
    };
  });

