'use strict';

angular.module('angularApp')
  .controller('UsersEditorCtrl', ['$scope', 'groups', 'team', 'rights', 'users', 'roles', '$window', 'unsavedRoleChanges', function (
    $scope,
    groups,
    team,
    rights,
    users,
    roles,
    $window,
    unsavedRoleChanges) {
    $scope.selectorGroupsAndTeams = [];
    $scope.showAllUsers = false;
    $scope.groupsDetail = {};
    $scope.teamItems = [];
    $scope.groupItems = [];

    $scope.NOPASSWORD = users.NOPASSWORD;

    $scope.$watch('selectedTeam', function (n, o) {
      if ($scope.selectedTeam) {
        if ($scope.filterTeam != $scope.selectedTeam.label && $scope.preventLossOfChanges("filter")) {
          $scope.selectedTeam = o;
        } else {
          $scope.filterTeam = $scope.selectedTeam.label;
        }
      } else {
        if ($scope.filterTeam != "" && $scope.preventLossOfChanges("filter")) {
          $scope.selectedTeam = o;
        } else {
          $scope.filterTeam = "";
        }
      }
    });

    $scope.$watch('selectedGroup', function (n, o) {
      if ($scope.selectedGroup) {
        if ($scope.filterGroup != $scope.selectedGroup.label && $scope.preventLossOfChanges("filter")) {
          $scope.selectedGroup = o;
        } else {
          $scope.filterGroup = $scope.selectedGroup.label;
        }
      } else {
        if ($scope.filterGroup != "" && $scope.preventLossOfChanges("filter")) {
          $scope.selectedGroup = o;
        } else {
          $scope.filterGroup = "";
        }
      }
    });

    groups.getGroupsWithRoles()
      .then(function (groups) {
        $scope.groupItems = groups.data;
      });

    rights.getRightTypes()
      .then(function (rights) {
        $scope.rightTypeItems = rights.data;
      });

    users.getUsers()
      .then(function (users) {
        $scope.allICUsers = users.data;
      });

    roles.getRoles()
      .then(function (roles) {
        $scope.allICRoles = roles.data;
      });

    team.getTeams()
      .then(function (teams) {
        $scope.teamItems = teams.data;
      });

    groups.getGroupsNoTeams()
      .then(function (groups) {
        $scope.groupNoTeamItems = groups.data;
      });

    users.getTimezones()
      .then(function (timeZones) {
        $scope.timeZones = timeZones.data;
      });

    $scope.decorateUser = function(userDetail) {
      userDetail.status = userDetail.status_code == 'enabled';
      userDetail.password = $scope.NOPASSWORD;
      userDetail.myteam = _.filter($scope.teamItems, function(teamItem) {
        return _.contains(userDetail.team_ids, teamItem.id);
      });
      userDetail.myroles = _.map(_.filter($scope.groupNoTeamItems, function(group) {
        return _.contains(userDetail.role_ids, group.id);
      }), function(g) {
        var role = angular.copy(g);
        role.isDirect = _.contains(userDetail.direct_role_ids, g.id);
        return role
      });
    };

    $scope.decorateUsers = function() {
      _.each($scope.usersDetail, $scope.decorateUser);
    };

    $scope.refresh = function() {
      return users.getUsersWithDetails()
        .then(function (users) {
          $scope.usersDetail = _.reduce(users.data, function(acc, user) {
            acc[user.id] = user;
            user.password = $scope.NOPASSWORD;
            user.changes = {}
            return acc;
          }, {});
          $scope.decorateUsers();
        });
    };
    $scope.refresh();

    unsavedRoleChanges($scope, $window);

    $scope.$watch('teamItems', $scope.decorateUsers);
    $scope.$on('user:persisted', function(e, u) { $scope.refresh().then(u); });

    angular.element('input[ng-model=searchUser]').on('focus', function (e) {
      if ($scope.preventLossOfChanges('filter')) {
        e.currentTarget.blur();
      } else {
        $scope.clearChanges();
      }
    });
  }]);
