angular.module('angularApp').directive('tsIncludeFresh', function($http){
  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      attrs.$observe('tsIncludeFresh', function(url){
        if(url === undefined || url === null || url === "") return;

        $http.get(url).then(function(res){
          $(elem).html(res.data);
          if(attrs.onload){
            scope.$eval(attrs.onload);
          }
        });
      });
    }
  }
});

