'use strict';

angular.module('angularApp')
  .factory('calendarUser', function (team, currentUser, $q) {
    var service = {
      possibleUsers: null,
      fetchedUsersFor: null
    };

    /**
     * Get a list of possible calendar users, specific for an each user
     * @return {Promise}
     */
    service.getUsers = function () {
      var deferred = $q.defer();
      var currentUser = currentUser.user;

      team.getTeams()
        .then(function (teams) {
          var managingTeam = Lazy(teams.data).find(function (team) {
            return _.contains(_.keys(team.managers), currentUserOrAs.code);
          });

          if (managingTeam) {
            service.possibleUsers = Lazy(managingTeam.users).map(function (user, key) {
              return Lazy(key).drop(5).join('');
            })
            .toArray()
            .sort();
          } else {
            service.possibleUsers = Lazy(teams.data).map(function (team) {
              var users = team.users;

              users = Lazy(users).map(function (user, key) {
                return Lazy(key).drop(5).join('');
              }).toArray();

              return users;
            })
            .flatten()
            .toArray();
          }

          service.possibleUsers.push(Lazy(currentUserOrAs.code).drop(5).join(''));

          service.possibleUsers = Lazy(service.possibleUsers).uniq().toArray();

          service.possibleUsers.sort();

          service.fetchedUsersFor = currentUserOrAs;

          deferred.resolve(service.possibleUsers);
        });

      return deferred.promise;
    };

    return service;
  });
