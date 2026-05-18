(function () {
  var app = angular.module('angularApp');

  fetchData().then(bootstrapApplication);

  function fetchData () {
    var initInjector = angular.injector(['ng']);
    var $http = initInjector.get('$http');

    return $http.get('/settings.json').then(function (response) {
      app.constant('settings', response.data);
    }, function (errorResponse) {
      gToast.open('Can\'t fetch settings of the application');
    });
  }

  function bootstrapApplication () {
    angular.element(document).ready(function () {
      angular.bootstrap(document.body, ['angularApp']);
    });
  }
}());
