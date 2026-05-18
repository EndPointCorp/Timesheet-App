'use strict';

angular.module('angularApp')
  .factory('spinner', function($q, $rootScope){
    var service = {
      isSpinner: false,
      requests: 0
    }
    service.show = function() {
      service.requests++;
      if (service.requests === 1){
        service.isSpinner = true;
      }
    }
    service.hide= function() {
      service.requests--;
      if (service.requests <= 0){
        service.isSpinner = false;
        service.requests = 0;
      }
    }
    $rootScope.$on('spinner:started', function(){
      window._request = true;
      service.show();
    });
    $rootScope.$on('spinner:completed', function(){
      window._request = false;
      service.hide();
    });

    return service;
  })
  .factory('spinnerInterceptor', function($q, $rootScope){
      return {
        'request': function (config) {
	  if(config.url.match(/\/front\.version.*/) === null){
            $rootScope.$broadcast('spinner:started');
	  }
          return $q.when(config);
        }, 'response': function (response) {
	  if(response.config.url.match(/\/front\.version.*/) === null){
            $rootScope.$broadcast('spinner:completed');
	  }
          return $q.when(response);
        }, 'responseError': function (rejection) {
	  if(rejection.config.url.match(/\/front\.version.*/) === null){
            $rootScope.$broadcast('spinner:completed');
	  }
          return $q.reject(rejection);
        }
      };
  });


