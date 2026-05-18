angular.module('angularApp').directive('tsFocus', function($timeout) {
  return {
    link: function ( scope, element, attrs ) {
      scope.$watch( attrs.tsFocus, function ( val, old ) {
        if ( angular.isDefined( val ) && val ) {
          $timeout( function () { element[0].focus(); } );
        }
      }, true);

      element.bind('blur', function () {
        scope.$apply(function(){
          attrs.tsFocus = false;
        });
        if ( angular.isDefined( attrs.tsFocusLost ) ) {
          scope.$apply( attrs.tsFocusLost );

        }
      });
    }
  };
});
