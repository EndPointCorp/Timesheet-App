'use strict';

angular.module('angularApp')
  .factory('reviews', function($http, $q){
    var service = {};

    service.fetchReviewStats = function() {
      var deferred = $q.defer();

      $http.get('/approvals/stats.json').then(function (data) {
        deferred.resolve(data.data);        
      }, function (data) {
        deferred.reject(data.data);
      });

      return deferred.promise;
    }

    service.fetchReviewEntries = function() {
      var deferred = $q.defer();

      $http.get('/approvals.json').then(function (data) {
        data.data.forEach(function(item) {
          if(typeof item.total_fees === "string" && item.total_fees !== "") {
            item.total_fees = parseFloat(item.total_fees, 10);
          }
        });
        deferred.resolve(data.data);        
      }, function (data) {
        deferred.reject(data.data);
      });

      return deferred.promise;
    };

    service.batchAccept = function (olderThan) {
      var deferred = $q.defer();

      $http.patch('/approvals', JSON.stringify({
        approved: true,
        date_older_than: olderThan
      })).then(function (data) {
        deferred.resolve(data.data);        
      }, function (data) {
        deferred.reject(data.data);
      });

      return deferred.promise;
    };

    service.acceptEntry = function (entry) {
      var deferred = $q.defer();

      $http.patch('/approvals/' + entry.id, JSON.stringify({
        approved: true
      })).then(function (data) {
        deferred.resolve(data.data);        
      }, function (data) {
        deferred.reject(data.data);
      });

      return deferred.promise;
    };

    service.undoLast = function (entry) {
      var deferred = $q.defer();

      $http.post('/approvals/undo_last').then(function (data) {
        deferred.resolve(data.data);        
      }, function (data) {
        deferred.reject(data.data);
      });

      return deferred.promise;
    };

    service.rejectEntry = function (entry) {
      var deferred = $q.defer();

      $http.patch('/approvals/' + entry.id, JSON.stringify({
        approved: false,
        comment:  entry.rejectionComment
      })).then(function (data) {
        deferred.resolve(data.data);        
      }, function (data) {
        deferred.reject(data.data);
      });

      return deferred.promise;
    };

    return service;
  });
