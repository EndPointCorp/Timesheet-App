'use strict';

angular.module('angularApp')
  .factory('projects', function($http, $q){
    var service = {};

    service.fetchEntriesFor = function(project_id) {
      var deferred = $q.defer();
      $http.get('/hours/entries.json?budget_id=' + project_id).then(function(resp) {
        deferred.resolve(resp.data);
      }, function(resp) {
        deferred.reject(resp.data);
      });
      return deferred.promise;
    };

    service.fetchActiveProjects = function(period) {
      var deferred = $q.defer();
      period = period === undefined ? '1 year;' : period;

      $http.get('/hours/active_projects.json?period=' + period).then(function (data) {
        deferred.resolve(data.data);        
      }, function (data) {
        deferred.reject(data.data);
      });

      return deferred.promise;
    };

    return service;
  });

