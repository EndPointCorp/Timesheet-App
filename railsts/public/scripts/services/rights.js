'use strict';

angular.module('angularApp')
  .factory('rights', function ($http, $q) {
    var service = {};

    /**
     * Getting all the right types list
     * @return {deferred}
     */
    service.getRightTypes = function () {
      var deferred = $q.defer();

      var ht = $http.get('/right_types.json');

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'list of all the right types',
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

    /**
     * Getting a right type object by code
     * @param  {string} code
     * @return {mixed}
     */
    service.getRightTypeByCode = function (code) {
      var typeToGet = false;
      var deferred = $q.defer();

      service.getRightTypes()
        .then(function (rightTypes) {
          var rightTypes = Object.keys(rightTypes.data).map(function (key) {
              return rightTypes.data[key];
            }
          );

          typeToGet = rightTypes.filter(function (rightType) {
            if (rightType.code === code) {
              return true;
            }
          });

          if (typeToGet.length === 1) {
            deferred.resolve({
              status: 'ok',
              message: 'right type data',
              data: typeToGet[0]
            });
          }
          
          deferred.reject({
            status: 'error',
            message: 'type not found'
          }); 
        }); 

      return deferred.promise;   
    };

    return service;
  });
