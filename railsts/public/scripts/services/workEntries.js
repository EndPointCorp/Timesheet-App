'use strict';

angular.module('angularApp')
  .factory('workEntries', function($http, $rootScope, currentUser){
    var service = {
      entries: []
    };

    var workChartIdFrom = function(entryLike){
      return entryLike.work_chart_id || entryLike.workChartId ||
        (entryLike.chart ? entryLike.chart.id : null) || (entryLike.workChart ? entryLike.workChart.id : null);
    };
    var datePerformedFrom = function(entryLike) {
      var date = entryLike.datePerformed || entryLike.date_performed;
      if(typeof date == 'string'){
        return date;
      }
      return date ? (date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()) : null;
    };
    var feeFrom = function(entryLike){
      var fee = entryLike.fee || 0;
      return [{
        fee: fee
      }];
    };
    var durationsFrom = function(entryLike){
      var durations = entryLike.durations || entryLike.work_entry_durations || entryLike.workEntryDurations;
      return Lazy(durations).map(function(d){
          var duration = {
            kind_code: d.kindCode || d.kind_code,
            duration: d.duration || (parseInt(d.minutes, 10) + 60*(parseInt(d.hours, 10)))
          }
          if(d.id){
            duration.id = d.id;
          }
          return duration;
        }).toArray()
    };
    
    service.reclaim = function(entryLike) {
      return $http.post("/work_entries/" + entryLike.id + "/reclaim.json");
    };

    service.createNew = function(entryLike){
      var entryParams = {
        work_chart_id: workChartIdFrom(entryLike),
        description: entryLike.description,
        date_performed: datePerformedFrom(entryLike),
        'work_entry_fees_attributes': feeFrom(entryLike),
        'work_entry_durations_attributes': durationsFrom(entryLike)
      };
      var q = $http.post("/work_entries.json", { work_entry: entryParams });
      return q;
    };

    service.update = function(entryLike){
      var entryParams = {
        id: entryLike.id,
        work_chart_id: workChartIdFrom(entryLike),
        description: entryLike.description,
        date_performed: datePerformedFrom(entryLike),
        'work_entry_fees_attributes': feeFrom(entryLike),
        'work_entry_durations_attributes': durationsFrom(entryLike)
      };
      return $http.put("/work_entries/" + entryLike.id + ".json", { work_entry: entryParams });
    }
    service.delete = function(id){
      return $http.delete("/work_entries/" + id + ".json");
    };
    service.fetchEntry = function(id){
      return $http.get("/work_entries/" + id + ".json");
    };
    service.fetchDayEntriesByDate = function(date){
      return $http.get("/work_entries/day.json?day=" + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate());
    };
    return service;
  });
