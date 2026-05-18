'use strict';

angular.module('angularApp')
  .controller('GroupsEditorCtrl', ['$scope', 'groups', 'rights', 'users', 'roles', '$window', 'unsavedRoleChanges', function (
    $scope,
    groups,
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

    $scope.$watch('selectedSelector', function (n, o) {
      if ($scope.selectedSelector) {
        if ($scope.filterRole != $scope.selectedSelector.label && $scope.preventLossOfChanges("filter")) {
          $scope.selectedSelector = o;
        } else {
          $scope.filterRole = $scope.selectedSelector.label;
        }
      } else {
        if ($scope.filterRole != "" && $scope.preventLossOfChanges("filter")) {
          $scope.selectedSelector = o;
        } else {
          $scope.filterRole = "";
        }
      }
    });

    $scope.refresh = function() {
      return groups.getGroupsWithRoles()
        .then(function (groups) {
          $scope.groupItems = groups.data;
        })
        .then(function() {
          groups.getGroupsWithDetails()
            .then(function (groups) {
              $scope.groupsDetail = groups.data;

              groups.data = Lazy(groups.data).map(function (group) {
                group.value = group.code;

                return group;
              }).toArray();

              $scope.selectorGroupsAndTeams = groups.data;
              $scope.decorateGroups(true);
            });
        });
    };

    $scope.refresh();

    rights.getRightTypes()
      .then(function (rights) {
        $scope.rightTypeItems = rights.data;
      });

    roles.getRoles()
      .then(function (roles) {
        $scope.allICRoles = roles.data;
      });

    $scope.decorateGroup = function(group, force) {
      if(force || group.changes === undefined || group.changes === null) {
        group.changes = {};
      }
      if(force || group.isChanged === undefined || group.isChanged === null) {
        group.isChanged = false;
      }
      group.myrights = group.direct_rights.concat(group.indirect_rights);
      if(force || group.myroles === null || group.myroles === undefined || group.myroles.length == 0){
        group.myroles = _.map(_.filter($scope.groupItems, function(groupItem) {
          return _.contains(group.role_ids, groupItem.id);
        }), function(g) {
          var role = angular.copy(g);
          role.isDirect = _.contains(group.direct_role_ids, g.id);
          return role
        });
      }
    };

    $scope.decorateGroups = function(force) {
      _.each($scope.selectorGroupsAndTeams, function(g) { $scope.decorateGroup(g, force === true); });
    };

    $scope.$watch('groupItems', $scope.decorateGroups);
    $scope.$on('group:persisted', function(e, u) { $scope.refresh().then(u); });

    unsavedRoleChanges($scope, $window);

    angular.element('input[ng-model=searchGroup]').on('focus', function (e) {
      if ($scope.preventLossOfChanges('filter')) {
        e.currentTarget.blur();
      } else {
        $scope.clearChanges();
      }
    });
  }]);
