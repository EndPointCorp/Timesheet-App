'use strict';
angular.module('angularApp')
  .factory('authenticationInterceptor', function($q, $rootScope) {
    return {
      request: function (config) {
        return config || $q.when(config);
      },
 
      requestError: function (rejection) {
        return $q.reject(rejection);
      },
 
      response: function (response) {
        return response || $q.when(response);
      },
 
      responseError: function (rejection) {
        if(rejection.status === 401){
          $rootScope.$broadcast('user-not-logged-in');
          return $q.reject(rejection);
        }
        else{
          return $q.reject(rejection); 
        }
        
        return $q.reject(rejection);
      }
    };
  });
