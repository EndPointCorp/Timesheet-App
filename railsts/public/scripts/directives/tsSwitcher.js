'use strict';

angular.module('angularApp').directive('tsSwitcher', function() {
  return {
    require: 'ngModel',
    restrict: 'AE',
    replace: true,
    template: "<div class=\"switch\"><div class=\"switch-button\">&nbsp;</div>\n</div>",
    link: function(scope, element, attrs, ngModel) {
      var _toggle = function() {
        ngModel.$setViewValue(!ngModel.$viewValue);
        return updateModel();
      };

      $(element).on('click', _toggle);

      var updateModel = function() {
        var _class = ngModel.$viewValue ? 'switch-right' : 'switch-left';
        $(element).removeClass("switch-right");
        $(element).removeClass("switch-left");
        $(element).addClass(_class);
      };

      return ngModel.$render = function() {
        return updateModel();
      };
    }
  };
});


