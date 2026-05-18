'use strict';

angular.module('angularApp')
  .factory('groups', function ($http, $q, workCharts) {
    var service = {};

    service.getGroups = function () {
      var deferred = $q.defer();

      var ht = $http.get('/groups.json');

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'list of groups',
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

    service.getGroupsWithRoles = function () {
      var deferred = $q.defer();

      var ht = $http.get('/groups/groups_with_roles.json');

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'list of groups with roles',
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

    service.getGroupsNoTeams = function () {
      var deferred = $q.defer();

      var ht = $http.get('/groups/groups_no_teams.json');

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'list of groups with no teams included',
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

    service.getGroupsWithDetails = function () {
      var deferred = $q.defer();

      var ht = $http.get('/groups/details.json');

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'list of groups with details',
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

    service.getGroup = function (id) {
      var deferred = $q.defer();

      var ht = $http.get('/groups/details/' + id);

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'single group data',
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

    service.updateGroup = function (changes, groupId) {
      var deferred = $q.defer();

      var ht = $http({
        method: 'PUT',
        url: '/groups/' + groupId,
        data: {
          group_entity: JSON.stringify(changes), 
          group_id: groupId
        },
        headers: {
          contentType : 'application/json; charset=utf-8'
        }
      });

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'Group updated'
        });
      }, function (errors) {
        deferred.reject({
          status: 'error',
          message: errors
        });
      });

      return deferred.promise;
    };

    service.createGroup = function (label, code, description) {
      var params = {
        'label': label,
        'code': code,
        'description': description
      };

      var deferred = $q.defer();

      var ht = $http.post('/groups.json', params);

      ht.then(function (data) {
        deferred.resolve({
          status: 'ok',
          message: 'group created',
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
