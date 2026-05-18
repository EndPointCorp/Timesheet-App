'use strict';

angular.module('angularApp')
  .factory('currentUser', function($http, $rootScope, $location, $q, $routeParams){
    var service = {
      user: null
    };
    $rootScope.$watch(function(){
      return service.user;
    }, function(newUser, old){
      if(newUser !== null){
        if($location.path() == '/login'){
          $location.url($location.search().ret || "/");
        }
      }
      else{
        if(old !== null){
          $location.url("/login");
        }
      }
    });
    service.refresh = function(callback){
      var q = $http.get("/users/current.json");
      q.then(function(data){
        var user = data.data;
        if(user.as != null && user.as != undefined && user.as != ''){
          user.asLabel = Lazy(user.as).drop(6).join('');
        }
        service.user = user;
      });
      return q;
    };
    service.logout = function() {
      var req = $http.delete("/users/sign_out.json");

      req.then(function () {
        service.user = null;
        $location.url("/login");
      });

      return req;
    };
    service.getTimeZones = function(){
      return  $http.get("/time_zones");
    };
    service.tryCreateUser = function(name, usermail, timeZone, password, startDate, teams){
      var params = {
        'email': usermail,
        'name': name,
        'time_zone_code': timeZone,
        'start_date': startDate.toDateString(),
        'password': password,
        'teams': teams
      };
      var q = $http.post('/users', params);
      return q;
    };
    service.tryUpdateUserEntity = function(changes, userId){
      var q = $http({ method: 'PUT',
        url: '/users/' + userId,
        data: {user_entity: JSON.stringify(changes), user_id: userId},
        headers: {contentType : 'application/json; charset=utf-8'}
      });
      return q;
    };
    service.tryLogIn = function(username, password){
      var deferred = $q.defer();

      var params = {
        'user[email]': username,
        'user[password]': password,
        'user[remember_me]': 1
      };

      $http({ method: 'POST', 
              url: "/users/sign_in.json", 
              data: params }).then(function(data){
        if(data.status == 200) {
          setTimeout(function(){
            service.refresh();
          }, 500);

          deferred.resolve(data);
        } else {
          deferred.reject('error');
        }
      });

      return deferred.promise;      
    };
    service.getPtos = function(){
      return $http.get("/ptos.json");
    };
    service.cachedPtos = function(){
      if(service.user === null || service.user === undefined){
        return [];
      }
      return null;
    };
    service.getSwitchableRoles = function(){
      return $http.get("/users/others.json");
    };
    service.getAllRoles = function(){
      return $http.get("/users/all_roles.json");
    };
    service.getReportableRoles = function(){
      return $http.get("/users/reportable.json");
    };
    service.getAllGroups = function(){
      return $http.get("/groups/all_groups.json");
    };
    service.getAllRightTypes= function(){
      return $http.get("/users/all_right_types.json");
    };
    service.getAllGroupDetails = function(){
      return $http.get("/groups/details.json");
    };
    service.getAllUserDetails = function(){
      return $http.get("/users/details.json");
    };
    service.getAllRawDetails = function(){
      return $http.get("/users/details_raw.json");
    };
    service.getUserDetails = function(userId){
      return $http.get("/users.json?user_id="+userId);
    };
    service.getAllTeams = function(){
      return $http.get("/team/teams.json");
    };
    service.switchTo = function(role){
      var q = $http.post("/users/assume.json", {email: role.email});
      q.then(function(){
        service.refresh();
      });
      return q;
    };
    service.refresh();
    return service;
  });
