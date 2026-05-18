'use strict';

angular.module('angularApp')
  .factory('appVersion', function($http, $rootScope, $interval){
    var service = {
      frontend: null
    };

    var _set = function(version) {
      if(service.version !== null && service.version !== version) {
        $rootScope.$broadcast('appVersion.frontend.changed');
      }
      service.frontend = version;
    }

    $interval(function(){
      $http.get("/front.version").then(_set);
    }, 5000);

    return service;
  });

