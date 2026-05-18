'use strict';

angular.module('angularApp')
  .factory('appVersion', function($http, $rootScope, $interval){
    var service = {
      frontend: null,
      frontendShouldReload: false
    };

    var _set = function(version) {
      if(service.frontend !== null && service.frontend !== version.data) {
        service.frontendShouldReload = true;
        $rootScope.$broadcast('appVersion.frontend.changed');
      }
      service.frontend = version.data;
    }

    $interval(function(){
      $http.get("/front.version?v=" + (new Date().getTime())).then(_set);
    }, 5000);

    return service;
  });

