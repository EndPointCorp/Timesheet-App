angular.module('angularApp')
  .config(function ($routeProvider, $httpProvider, $sceDelegateProvider) {
    $httpProvider.interceptors.push('authenticationInterceptor');
    $httpProvider.interceptors.push('workChartsInterceptor');
    $httpProvider.interceptors.push('spinnerInterceptor');
    // $httpProvider.interceptors.push('logToServerInterceptor');
    $httpProvider.interceptors.push(function($q, $rootScope) {
      return {
        'response': function(response) {
           if((response.status < 200 || response.status > 299) && response.status != 102) {
             if (response.status == 401) {
               $rootScope.$broadcast('communication:unauthorized');
             } else {
               $rootScope.$broadcast('communication:error');
             }
           }
           return response;
        },

        'requestError': function(rejection) {
          $rootScope.$broadcast('communication:failure');
          return $q.reject(rejection);
        },

        'responseError': function(rejection) {
          if (rejection.status == 401) {
            $rootScope.$broadcast('communication:unauthorized');
          } else {
            $rootScope.$broadcast('communication:error', rejection.data);
          }
          return $q.reject(rejection);
        }
      };
    });
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    $httpProvider.defaults.headers.put['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    $httpProvider.defaults.transformRequest = [function(data) {
      /**
       * The workhorse; converts an object to x-www-form-urlencoded serialization.
       * @param {Object} obj
       * @return {String}
       */
      var param = function(obj)
      {
        var query = '';
        var name, value, fullSubName, subName, subValue, innerObj, i;

        for(name in obj)
        {
          value = obj[name];

          if(value instanceof Array)
          {
            for(i=0; i<value.length; ++i)
            {
              subValue = value[i];
              fullSubName = name + '[' + i + ']';
              innerObj = {};
              innerObj[fullSubName] = subValue;
              query += param(innerObj) + '&';
            }
          }
          else if(value instanceof Object)
          {
            for(subName in value)
            {
              subValue = value[subName];
              fullSubName = name + '[' + subName + ']';
              innerObj = {};
              innerObj[fullSubName] = subValue;
              query += param(innerObj) + '&';
            }
          }
          else if(value !== undefined && value !== null)
          {
            query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
          }
        }

        return query.length ? query.substr(0, query.length - 1) : query;
      };

      return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
    }];
  });
