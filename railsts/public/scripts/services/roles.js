'use strict';

angular.module('angularApp')
  .factory('roles', function ($http, $q) {
    var service = {};

    service.getRoles = function () {
      var deferred = $q.defer();

      var ht = $http.get('/roles.json');

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'list of all the roles',
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
