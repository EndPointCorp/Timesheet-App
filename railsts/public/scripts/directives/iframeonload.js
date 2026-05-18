angular.module('angularApp').directive('iframeOnload', ['$rootScope', function($rootScope){
  return {
    scope: {
      callBack: '&iframeOnload'
    },
    link: function(scope, element, attrs){
      element.on('load', function(){
        scope.callBack();
        setTimeout(function(){
          $rootScope.$digest();
        }, 100);
      });
    }
}}])
