'use strict';

angular.module('angularApp')
  .factory('transactions', function($http, $rootScope, currentUser, $filter) {
    var service = {
    };

    service.addTransaction = function(hours, workChartId, date, dateClosed, description, kind_code, recur, mode) {
      var recur_at = recur;
      if(Lazy(recur_at).values().every(function(v){ return v === null || v === undefined; })){
        recur_at = null;
      }
      return $http.post('transactions/create_transaction.json', {
        hours: (hours || 0),
        work_chart_id: workChartId,
        date: $filter('date')(date, 'yyyy-MM-dd'),
        date_closed: dateClosed === undefined ? dateClosed : $filter('date')(dateClosed, 'yyyy-MM-dd'),
        description: description,
        kind_code: kind_code,
        mode: mode,
        recur_at: recur_at
      });
    };

    service.loadTransactions = function(workChartId) {
      return $http.get('/transactions.json', {
        params: {
          work_chart_id: workChartId
        }
      });
    };

    service.deleteTransaction = function(id) {
      return $http.delete('/transactions/' + id);
    };

    service.updateTransaction = function(transaction) {
      var recur_at = transaction.recur_at;
      if(Lazy(recur_at).values().every(function(v){ return v === null || v === undefined; })){
        recur_at = null;
      }
      return $http.post('transactions/update_transaction.json', {
        hours: (transaction.hours || 0),
        date: $filter('date')(transaction.date, 'yyyy-MM-dd'),
        date_closed: transaction.date_closed === undefined ? transaction.date_closed : $filter('date')(transaction.date_closed, 'yyyy-MM-dd'),
        description: transaction.description,
        mode: transaction.mode,
        recur_at: transaction.recur_at,
        id: transaction.id,
        recur_mode: (transaction.recur_mode_cumulative ? 'cumulative' : 'zero-out')
      });
    };

    return service;
  });
