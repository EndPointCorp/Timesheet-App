angular.module('ngFilters', []).filter('n2br', function() {
  return function(input) {
    return input ? input.replace(/\n/g, "<br/>") : input;
  };
});