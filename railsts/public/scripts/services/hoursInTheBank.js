'use strict';

angular.module('angularApp')
  .factory('hoursInTheBank', function($q, $http, $timeout){
    var service = {
    };
    service.fetchSummary = function(){
      var deferred = $q.defer();
      $http.get('/hours/summary.json').then(function(data){
        deferred.resolve(Lazy(data.data).map(function(item){
          return {
            labels: item.budget_chart_labels.splice(1, 10),
            id: item.budget_chart_id,
            minutesLeft: item.minutes_left,
            hoursLeft: item.minutes_left / 60,
            mode: item.mode,
            modeSymbol: item.mode == 'billable' ? 'B' : 'NB'
          }
        }).toArray());
      });
      return deferred.promise;
    };
    service.fetchBudgetFor = function(chart){
      var deferred = $q.defer();
      $http.get('/hours/' + chart.id + '.json').then(function(data){
          if(data.status == 102){
            deferred.notify(data.data);
            $timeout(function() {
              service.fetchBudgetFor(chart).then(function(data){
                deferred.resolve(data);
              },
              function() {
                deferred.reject("Server error");
              },
              function(data) {
                deferred.notify(data);
              })
            }, 2000);
          }
          else {
            var items = Lazy(data.data).map(function(item){
                return {
                  budgetChartLabels: (item.budget_chart_labels == null ? [] :
                                        item.budget_chart_labels.splice(1, 10)),
                  id: item.work_chart_id,
                  budgetChartId: item.budget_chart_id,
                  minutesLeft: (item.minutes_left || 0),
                  hoursLeft: (item.minutes_left || 0) / 60,
                  mode: item.mode,
                  modeSymbol: item.mode == 'billable' ? 'B' : 'NB'
                };
              }).filter(function(i){ return i.budgetChartId != null;}).toArray();

            deferred.resolve(items);
          }
      });
      return deferred.promise;
    };
    return service;
  });

