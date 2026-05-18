'use strict';

angular.module('angularApp')
  .factory('users', function ($http, $q, workCharts) {
    var service = {};

    // a marker of a no password set to have easy stars
    // that are looking the same on each field
    service.NOPASSWORD = '!!!NOPASSWORD!!!';

    /**
     * Getting a list of user
     * @return {deferred}
     */
    service.getUsers = function () {
      var deferred = $q.defer();

      var ht = $http.get('/users.json');

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'list of all the users',
          data: data.data
        });
      }, function (errors) {
        deferred.reject({
          status: 'error',
          message: errors
        });
      });

      return deferred.promise;
    };

    /**
     * Getting a single user
     * @param  {Number} userId
     * @return {deferred}
     */
    service.getUser = function (userId) {
      var deferred = $q.defer();

      var ht = $http.get('/users/' + userId + '.json');

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'single user',
          data: data.data
        });
      }, function (errors) {
        deferred.reject({
          status: 'error',
          message: errors
        });
      });

      return deferred.promise;
    };

    /**
     * Getting a list of users with details for each users
     * @return {deferred}
     */
    service.getUsersWithDetails = function () {
      var deferred = $q.defer();

      var ht = $http.get('/users/details.json');

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'list of all the users with details',
          data: data.data
        });
      }, function (errors) {
        deferred.reject({
          status: 'error',
          message: errors
        });
      });

      return deferred.promise;
    };

    /**
     * Creating a user
     * @param  {String} name
     * @param  {String} usermail
     * @param  {Number} timeZone
     * @param  {String} password
     * @param  {Date} startDate
     * @param  {Array} teams
     * @return {deferred}
     */
    service.createUser = function (name, usermail, timeZone, password, startDate, teams) {
      var deferred = $q.defer();

      var params = {
        'name': name,
        'email': usermail,
        'time_zone_code': timeZone,
        'start_date': startDate.toDateString(),
        'password': password,
        'teams': teams
      };

      var ht = $http.post('/users', params);

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'created a user',
          data: data.data
        });
      }, function (errors) {
        deferred.reject({
          status: 'error',
          message: errors
        });
      });

      return deferred.promise;
    };

    /**
     * Updating user data
     * @param  {Object} changes
     * @param  {Number} userId
     * @return {deferred}
     */
    service.updateUser = function (changes, userId) {
      var deferred = $q.defer();

      var ht = $http({
        method: 'PUT',
        url: '/users/' + userId,
        data: {
          user_entity: JSON.stringify(changes),
          user_id: userId
        },
        headers: {
          contentType: 'application/json; charset=utf-8'
        }
      });

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'User updated'
        });
      }, function (errors) {
        deferred.reject({
          status: 'error',
          message: errors
        });
      });

      return deferred.promise;
    };

    /**
     * Getting a list of timezones that users can use
     * @return {deferred}
     */
    service.getTimezones = function () {
      var deferred = $q.defer();

      var ht = $http.get('/time_zones.json');

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'list of all the timezones',
          data: data.data
        });
      }, function (errors) {
        deferred.reject({
          status: 'error',
          message: errors
        });
      });

      return deferred.promise;
    };

    return service;
  });
