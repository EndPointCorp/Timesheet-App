angular.module('ngEscapeFilter', []).filter('escapeHTML', function() {
  return function(text) {
    if (text) {
      return text.
          replace(/&/g, '&amp;').
          replace(/</g, '&lt;').
          replace(/>/g, '&gt;').
          replace(/'/g, '&#39;').
          replace(/"/g, '&quot;');
    }
    return text;
  };
});