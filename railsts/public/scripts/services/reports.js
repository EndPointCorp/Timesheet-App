'use strict';

angular.module('angularApp')
  .factory('reports', function ($http, $q) {
    var service = {};

    service.getPresets = function () {
      var deferred = $q.defer();

      var ht = $http.get("/reports/presets.json");

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'list of presets',
          data: data.data
        });
      }, function (errors) {
        deferred.reject({
          status: 'error',
          message: errors
        });
      });

      return deferred.promise;
    };

    service.createPreset = function (settings) {
      var deferred = $q.defer();

      var ht = $http.post('/reports/create_preset', settings);

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'created a report preset',
          data: data.data
        });
      }, function (errors) {
        deferred.reject({
          status: 'error',
          message: errors
        });
      });

      return deferred.promise;
    };

    service.removePreset = function (presetId) {
      var deferred = $q.defer();

      var ht = $http.delete('/reports/remove_preset/' + presetId);

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'removed a report preset',
          data: data.data
        });
      }, function (errors) {
        deferred.reject({
          status: 'error',
          message: errors
        });
      });

      return deferred.promise;
    };

    return service;
  });
