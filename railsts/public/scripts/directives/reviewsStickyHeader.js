'use strict';

angular.module('angularApp')
.directive('fsmStickyHeader', ['$timeout', function($timeout) {
  return {
    restrict: 'A',
    replace: false,
    scope: { 
      scrollBody: '=',
      scrollStop: '=',
      scrollableContainer: '=',
      contentOffset: '=',
      index: '='
    },
    link: function(scope, element, attributes, control) {
      var header = $(element, this);
      var clonedHeader = null;
      var content = $(scope.scrollBody);
      var scrollableContainer = $(scope.scrollableContainer);
      var contentOffset = scope.contentOffset || 0;
      scope.pass = false;
      var parentHeader = header.parent().parent();

      if (scrollableContainer.length === 0) {
        scrollableContainer = $(window);
      }

      function determineVisibility () {
        if (scope.pass === true) {
          return false;
        }
        
        var scrollTop = scrollableContainer.scrollTop() + scope.scrollStop;
                            
        var contentTop = parentHeader.offset().top + contentOffset;
        
        if (parentHeader.nextAll('tr').length == '0') {
          return false;
        }
            
        if (parentHeader.nextAll('tr.header-row').length == '0') {
          var bottomEl = parentHeader.nextAll('tr').last().prev();
        } else {
          var bottomEl = parentHeader.nextAll('tr.header-row').first().prev();
        }
        
        var contentBottom = bottomEl.offset().top + bottomEl.outerHeight();

        if ( (scrollTop > contentTop) && (scrollTop < contentBottom) ) {
          if (!clonedHeader) {
            createClone();    
            clonedHeader.css({ "visibility": "visible"});
          }
                
          if ( scrollTop < contentBottom && scrollTop > contentBottom - clonedHeader.outerHeight(false) ) {
            var top = contentBottom - scrollTop + scope.scrollStop - clonedHeader.outerHeight(false);
            clonedHeader.css('top', top + 'px');
          } else {
            calculateSize();
          }
        } else {
          if (clonedHeader) {
            header.remove();
            header = clonedHeader;
            clonedHeader = null;

            header.removeClass('sticky-header');
            header.css({
              position: 'relative',
              left: 0,
              top: 0,
              width: 'auto',
              'z-index': 111,
              visibility: 'visible'
            });
          }
        }
      };

      function calculateSize () {        
        clonedHeader.css({
          top: scope.scrollStop,
          width: header.outerWidth(),
          left: header.offset().left
        });
      };
        
      function createClone () {
        clonedHeader = header;
        header = clonedHeader.clone();
        clonedHeader.after(header);
        clonedHeader.addClass('sticky-header');
        clonedHeader.css({
          position: 'fixed',
          'z-index': 10000,
          visibility: 'hidden'
        });                
        
        calculateSize();
      };  
      
      function updateCounter () {
        $timeout(function () {
          var childElems = parentHeader.nextUntil('tr.header-row');
          
          scope.index = childElems.length;
        }, 5);
      };

      scrollableContainer.on('scroll.fsmStickyHeader', determineVisibility);
      scrollableContainer.on('resize.fsmStickyHeader', determineVisibility);

      scope.$on('$destroy', function () {
        scope.pass = true;
      });
        
      element.outerWidth($('#reviews-entries').outerWidth());
        
      scope.$on('reviews-list-updated', function () {
        determineVisibility();
        updateCounter();
      });
      
      updateCounter();
    }
  };
}]);