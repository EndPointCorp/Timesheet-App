'use strict';

angular.module('angularApp')
  .factory('team', function ($http, $q) {
    var service = {};

    service.fetchTeamMembersTotals = function (from, to, team) {
      var _from = from.getFullYear() + "-" + (from.getMonth() + 1) + "-" + from.getDate();
      var _to = to.getFullYear() + "-" + (to.getMonth() + 1) + "-" + to.getDate();

      if((angular.isUndefined(team) || team === null || team === "")) {
        team = "whole_company"
      }

      var q = $http.get("/team/totals.json?from=" + _from + "&to=" + _to + "&team=" + team);

      return q;
    };

    service.getTeams = function () {
      var deferred = $q.defer();

      var ht = $http.get("/team/teams.json");

      ht.then(function (data) {
        data.data.map(function (team) {
          team.label = team.display_label;
          team.id = team.role_id;

          return team;
        });

        deferred.resolve({
          status: 'ok',
          message: 'list of teams',
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
