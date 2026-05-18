angular.module('logToServer', [])
  .config(function ($provide) {
    $provide.decorator('$log', ['$delegate', function ($delegate) {
      var methods = {
        error: function () {
          $delegate.error.apply($delegate, arguments);
          JL('Angular').error(arguments);
        },
        log: function () {
          $delegate.log.apply($delegate, arguments);
          JL('Angular').trace(arguments);
        },
        info: function () {
          $delegate.info.apply($delegate, arguments);
          JL('Angular').info(arguments);
        },
        warn: function () {
          $delegate.warn.apply($delegate, arguments);
          JL('Angular').warn(arguments);
        }
      };

      return methods;
    }]);
  })
  .config(function ($provide) {
    $provide.decorator('$exceptionHandler', ['$delegate', function ($delegate) {
      return function (exception, cause) {
        JL('Angular').fatalException(cause, exception);
        $delegate(exception, cause);
      };
    }]);
  })
  .factory('logToServerInterceptor', ['$q', function ($q) {
    var myInterceptor = {
      'request': function (config) {
        config.msBeforeAjaxCall = new Date().getTime();

        return config;
      },
      'response': function (response) {
        if (response.config.warningAfter) {
          var msAfterAjaxCall = new Date().getTime();
          var timeTakenInMs = msAfterAjaxCall - response.config.msBeforeAjaxCall;

          if (timeTakenInMs > response.config.warningAfter) {
            JL('Angular.Ajax').warn({
              timeTakenInMs: timeTakenInMs,
              config: response.config,
              data: response.data
            });
          }
        }

        return response;
      },
      'responseError': function (rejection) {
        var errorMessage = 'timeout';
        if (rejection && rejection.status && rejection.data) {
          errorMessage = rejection.data.ExceptionMessage;
        }
        JL('Angular.Ajax').fatalException({
          errorMessage: errorMessage,
          status: rejection.status,
          config: rejection.config
        }, rejection.data);

        return $q.reject(rejection);
      }
    };

    return myInterceptor;
  }]);
