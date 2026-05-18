angular.module('angularApp')
  .config(function ($routeProvider, $httpProvider, $sceDelegateProvider) {
    var isLoggedIn = function ($q, currentUser) {
      var deferred = $q.defer();

      if (currentUser.user == null) {
        deferred.reject({
          needsAuthentication: true
        });
      } else {
        deferred.resolve();
      }

      return deferred.promise;
    };

    var canEditWorkCharts = function ($q, currentUser) {
      var deferred = $q.defer();

      if (currentUser.user == null || currentUser.user.can_edit_charts === false) {
        deferred.reject({
          needsAuthentication: true,
          returnPath: false
        });
      } else {
        deferred.resolve();
      }

      return deferred.promise;
    };

    var isAdmin = function ($q, currentUser) {
      var deferred = $q.defer();

      if (currentUser.user == null || currentUser.user.is_admin === false) {
        deferred.reject({
          needsAuthentication: true,
          returnPath: false
        });
      } else {
        deferred.resolve();
      }

      return deferred.promise;
    };

    var canCreateUsers = function ($q, currentUser) {
      var deferred = $q.defer();

      if (currentUser.user == null || currentUser.user.can_create_users === false) {
        deferred.reject({
          needsAuthentication: true,
          returnPath: false
        });
      } else {
        deferred.resolve();
      }

      return deferred.promise;
    };

    var canSwitchRoles = function ($q, currentUser) {
      var deferred = $q.defer();

      if (currentUser.user == null || currentUser.user.can_switch_roles === false) {
        deferred.reject({
          needsAuthentication: true,
          returnPath: false
        });
      } else {
        deferred.resolve();
      }

      return deferred.promise;
    };

    $sceDelegateProvider.resourceUrlWhitelist([
      'self',
      'about:blank'
    ]);

    $routeProvider.whenAuthenticated = function(path, route) {
      route.resolve = route.resolve || {};

      angular.extend(route.resolve, { 
        isLoggedIn: ['$q', 'currentUser', isLoggedIn] 
      });

      angular.extend(route.resolve, route.permissions);

      return $routeProvider.when(path, route);
    };

    $routeProvider
      .whenAuthenticated('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl'
      })
      .whenAuthenticated('/entries/:year/:month/:day/new', {
        templateUrl: 'views/entry.html',
        controller: 'WorkEntryCtrl'
      })
      .whenAuthenticated('/today', {
        templateUrl: 'views/day.html',
        controller: 'DayCtrl'
      })
      .whenAuthenticated('/entries/:year/:month/:day', {
        templateUrl: 'views/day.html',
        controller: 'DayCtrl'
      })
      .whenAuthenticated("/entries/:id/edit", {
        templateUrl: 'views/entry.html',
        controller: 'WorkEntryCtrl'
      })
      .whenAuthenticated("/calendar/:year/:month", {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .whenAuthenticated("/switch-role", {
        templateUrl: 'views/switchRole.html',
        controller: 'SwitchRoleCtrl',
        permissions: {
          isAdmin: ['$q', 'currentUser', canSwitchRoles] 
        }
      })
      .whenAuthenticated('/projects', {
        templateUrl: 'views/projects.html',
        controller: 'ProjectsCtrl'
      })
      .whenAuthenticated("/dashboard", {
        templateUrl: 'views/dashboard.html',
        controller: 'DashboardCtrl'
      })
      .whenAuthenticated("/work_charts/editor", {
        templateUrl: 'views/workChartsEditor.html?i=12233',
        controller: 'WorkChartsEditorCtrl',
        permissions: {
          canEditWorkCharts: ['$q', 'currentUser', canEditWorkCharts] 
        }
      })
      .whenAuthenticated("/work_charts/editor/:work_chart_id", {
        templateUrl: 'views/workChartsEditor.html',
        controller: 'WorkChartsEditorCtrl',
        permissions: {
          canEditWorkCharts: ['$q', 'currentUser', canEditWorkCharts] 
        }
      })
      .whenAuthenticated("/work_charts/editor/:work_chart_id/:selected_tab", {
        templateUrl: 'views/workChartsEditor.html',
        controller: 'WorkChartsEditorCtrl',
        permissions: {
          canEditWorkCharts: ['$q', 'currentUser', canEditWorkCharts] 
        }
      })
      .whenAuthenticated("/create_user", {
        templateUrl: 'views/createUser.html',
        controller: 'CreateUserCtrl',
        permissions: {
          isAdmin: ['$q', 'currentUser', canCreateUsers]
        }
      })
      .whenAuthenticated("/create_group", {
        templateUrl: 'views/createGroup.html',
        controller: 'CreateGroupCtrl',
        permissions: {
          isAdmin: ['$q', 'currentUser', canCreateUsers]
        }
      })
      .whenAuthenticated("/reports", {
        reloadOnSearch: false,
        templateUrl: 'views/reports.html',
        controller: 'ReportsCtrl'
      })
      .whenAuthenticated("/reports/:type/:start/:end/:root/:roles/:full/:show", {
        templateUrl: 'views/reports.html',
        controller: 'ReportsCtrl'
      })
      .whenAuthenticated("/users-editor", {
        templateUrl: 'views/usersEditor.html',
        controller: 'UsersEditorCtrl',
        permissions: {
          isAdmin: ['$q', 'currentUser', isAdmin] 
        }
      })
      .whenAuthenticated("/groups-editor", {
        templateUrl: 'views/groupsEditor.html',
        controller: 'GroupsEditorCtrl',
        permissions: {
          isAdmin: ['$q', 'currentUser', isAdmin] 
        }
      })
      .whenAuthenticated("/review", {
        templateUrl: 'views/reviewingDashboard.html',
        controller: 'ReviewingDashboardCtrl'
      })
      .whenAuthenticated('/calendar-user', {
        templateUrl: 'views/main.html',
        controller: 'CalendarUserCtrl'
      })
      .whenAuthenticated("/calendar-user/:year/:month", {
        templateUrl: 'views/main.html',
        controller: 'CalendarUserCtrl'
      })
      .whenAuthenticated("/calendar-user/:year/:month/:username", {
        templateUrl: 'views/main.html',
        controller: 'CalendarUserCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
