angular.module('angularApp')
  .run(function($rootScope, gToast, workCharts, $location, currentUser) {
    $rootScope.$on('communication:failure', function(){
      gToast.open('An error occurred: We were unable to send your request.');
    });
    $rootScope.$on('communication:error', function(_event, data){
      if(data != null && data.errors !== null && data.errors !== undefined){
        gToast.open(data.errors.join('<br />'));
      }
      else {
        gToast.open('An error occurred: Please check your connection and the status of the server.');
      }
    });

    $rootScope.$on('$routeChangeError', function(ev, current, previous, rejection) {
      if (rejection && rejection.needsAuthentication === true) {
        ev.preventDefault();
        var returnUrl = $location.url();

        if (rejection.returnPath === false) {
          $location.path('/login');       
        } else {
          $location.path('/login').search({ 
            ret: returnUrl
          });
        }
      }
    });

    // JSNlog configuration
    JL.setOptions({
      defaultAjaxUrl: '/client_log'
    });

    window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
      // Send object with all data to server side log, using severity fatal, 
      // from logger "onerrorLogger"
      JL("onerrorLogger").fatalException({
          "msg": "Exception!", 
          "errorMsg": errorMsg, "url": url, 
          "line number": lineNumber, "column": column
      }, errorObj);
        
      // Tell browser to run its own error handler as well   
      return false;
    };

    /**
     * Get a week number for a current Date object
     * @param  {Boolean} exact
     * @return {Number}     
     */
    Date.prototype.getWeekOfMonth = function(exact) {
      var month = this.getMonth()
          , year = this.getFullYear()
          , firstWeekday = new Date(year, month, 1).getDay()
          , lastDateOfMonth = new Date(year, month + 1, 0).getDate()
          , offsetDate = this.getDate() + firstWeekday - 1
          , index = 1 // start index at 0 or 1, your choice
          , weeksInMonth = index + Math.ceil((lastDateOfMonth + firstWeekday - 7) / 7)
          , week = index + Math.floor(offsetDate / 7)
      ;
      if (exact || week < 2 + index) return week;
      return week === weeksInMonth ? index + 5 : week;
    };
  });
