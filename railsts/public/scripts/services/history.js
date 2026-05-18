'use strict';

angular.module('angularApp')
  .factory('history', function($rootScope, $location){
    var service = {
      stack: []
    };
    $rootScope.$watch(function(){
      return $location.url();
    }, function(url){
      service.stack.push(url);
    });
    service.back = function(){
      while(Lazy(service.stack).last() == $location.url()){
        service.stack.pop();
      }
      if(service.stack.length == 0){
        $location.url("/");
      }
      else{
        $location.url(service.stack.pop());
      }
    };
    return service;
  })
