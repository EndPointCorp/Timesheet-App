'use strict';

angular.module('angularApp').directive('userDetails', function ($rootScope, currentUser, rolesEditor, $q, $filter, paginationService, gToast, users, confirmUnsavedChanges, appVersion, $timeout) {
    return {
        restrict: 'E',
        scope: {
          userDetails: "=",
          timeZones: "=",
          buttonItems: "=",
          groupItems: "=",
          rightTypeItems: "=",
          searchUser: "=",
          filterTeam: "=",
          filterGroup: "=",
          showInactiveUsers: "=",
          allICRoles: '=',
          allICUsers: '=',
          groupNoTeamItems: '='
        },
        templateUrl: 'views/_userDetails.html?v=1' + appVersion.frontend,
        link: function (scope, element, attrs) {
          scope.filteredUserDetailsList = []
          scope.searchUser = "";
          scope.custom = false;
          scope.modified = false;
          scope.workChart = undefined;
          scope.selectedChart = undefined;
          scope.userDetailsList = []
          scope.isShowAll = false;
          scope.originalUsers = {};
          scope.currentPage = 1;
          scope.pageSize = 8;

          scope.pageChangeHandler = function (num) {window.scrollTo(0, 0)};

          confirmUnsavedChanges(scope);

          scope.callUserUpdate = function () {
            var page = paginationService.getCurrentPage('__default');
            if (page) {
              var num = parseInt(page, 10);
              if (num ==0) {
                num = 1
              }
              paginationService.setCurrentPage('__default', num);
            } else {
              paginationService.setCurrentPage('__default', 1);
            }
          };

          scope.formatUserDetails = function (items) {
            var formattedData = [];

            angular.forEach(items, function (value, key) {
              if (value.status_code === 'enabled') {
                value.userStatus = true;
              } else if (value.status_code === 'disabled') {
                value.userStatus = false;
              }

              formattedData.push(value);
            });

            return formattedData;
          };

          scope.$watchGroup(['searchUser', 'showInactiveUsers', 'filterTeam', 'filterGroup'], function () {
            scope.applyFilterOnUsers();
          });

          scope.$on('user:updated', function (event) {
            scope.userDetailsList = [];
          });

          scope.$watch('userDetails', function (items) {
            var initialFilter = false;
            if (scope.userDetailsList.length == 0) {
              initialFilter = true;
            }
            scope.userDetailsList = [];
            angular.forEach(items, function (value, key) {
              scope.userDetailsList.push(value);
            });
            if (initialFilter) {
              scope.filteredUserDetailsList = scope.userDetailsList;
              scope.applyFilterOnUsers();
            }
          }, true);

          scope.applyFilterOnUsers = function () {
            scope.filteredUserDetailsList = scope.userDetailsList;
            if (scope.userDetailsList.length > 0) {
              scope.filteredUserDetailsList = $filter('filter')(scope.userDetailsList, {name: scope.searchUser});
              scope.filteredUserDetailsList = $filter('filter')(scope.filteredUserDetailsList, scope.showInactive);
              scope.filteredUserDetailsList = $filter('filterByRole')(scope.filteredUserDetailsList, 'myteam', scope.filterTeam);
              scope.filteredUserDetailsList = $filter('filterByRole')(scope.filteredUserDetailsList, 'myroles', scope.filterGroup);
              scope.filteredUserDetailsList = $filter('orderBy')(scope.filteredUserDetailsList, "name");
            } else {
              scope.filteredUserDetailsList = []
            }
            scope.totalPages = Math.ceil(scope.filteredUserDetailsList.length/scope.pageSize);
          };

          scope.loadRoles = function (query) {
            var deferred = $q.defer();
            var items = [];

            for (var i = 0; i < scope.allICRoles.length; i++) {
              if (scope.allICRoles[i]['label'].toLowerCase().indexOf(query) != -1) {
                scope.allICRoles[i]['name'] = scope.allICRoles[i]['label'];
                items.push(scope.allICRoles[i]);
              }
            }

            deferred.resolve(items);

            return deferred.promise;
          };

          scope.loadUsers = function (query) {
            var deferred = $q.defer();
            var items = [];

            for (var i = 0; i < scope.allICUsers.length; i++) {
              if (scope.allICUsers[i].username.indexOf(query) != -1) {
                scope.allICUsers[i]['name'] = scope.allICUsers[i]['username'];
                scope.allICUsers[i]['label'] = scope.allICUsers[i]['username'];
                items.push(scope.allICUsers[i]);
              }
            }

            deferred.resolve(items);

            return deferred.promise;
          };

          scope.cancelChanges = function (userId) {
            scope.userDetails[userId] = angular.copy(scope.originalUsers[userId]);
            scope.userDetails[userId].password = users.NOPASSWORD;
            scope.userDetailsList = [];
          };

          scope.saveChanges = function (changes, userId) {
            users.updateUser(changes, userId)
              .then(function () {
                $rootScope.$broadcast('user:persisted', function(){
                  $timeout(scope.applyFilterOnUsers, 500);
                });
                gToast.open('User saved successfully.');
            }, function (errorMessages) {
               gToast.open('Could not update a user entity. <br />Please contact the TimesheetApp development team');
            });
          };

          scope.setName = function () {
            var tmp = scope.userDetails[scope.currentUserId];

            scope.putUserToOriginalList(scope.currentUserId);

            tmp.changes.name = tmp.name;
            tmp.changes.isChanged = true;
            scope.userDetails[scope.currentUserId] = tmp;
          };

          scope.setPassword = function (user) {
            scope.putUserToOriginalList(user.id);
            user.changes.password = user.password;
            user.changes.isChanged = true;
          };

          scope.focusPassword = function (user) {
            if(user.changes.password === undefined) {
              user.password = '';
            }
          };

          scope.blurPassword = function (user) {
            if(user.changes.password === undefined || user.changes.password == '') {
              user.password = users.NOPASSWORD;
              user.changes.password = undefined;
            }
          };

          scope.setEmail = function () {
            var tmp = scope.userDetails[scope.currentUserId];

            scope.putUserToOriginalList(scope.currentUserId);

            tmp.changes.email = tmp.email;
            tmp.changes.isChanged = true;
            scope.userDetails[scope.currentUserId] = tmp;
          };

          scope.setStatus = function () {
            if (scope.currentUserId) {
              var tmp = scope.userDetails[scope.currentUserId];

              scope.putUserToOriginalList(scope.currentUserId);

              tmp.changes.status = tmp.status;
              tmp.changes.isChanged = true;
              scope.userDetails[scope.currentUserId] = tmp;
            }
          };

          scope.setTimeZone = function (timeZone) {
            var tmp = scope.userDetails[scope.currentUserId];

            scope.putUserToOriginalList(scope.currentUserId);

            tmp.changes.time_zone = timeZone;
            tmp.changes.isChanged = true;
            scope.userDetails[scope.currentUserId] = tmp;
          };

          scope.addObjectToArray = function (sourceArray, keyObject) {
            sourceArray.push(keyObject);
            return sourceArray;
          };

          scope.removeObjectFromArray = function (sourceArray, keyObject) {
            return sourceArray.filter(function (element) {
              return element.id !== keyObject.id
            });
          };

          scope.getObjectFromArray = function (sourceArray, keyObject) {
            return sourceArray.filter(function (element) {
              return element.id === keyObject.id
            });
          };

          scope.getObjectFromArrayByLabel = function (sourceArray, keyObject) {
            return sourceArray.filter(function (element) {
              return element.label === keyObject.label
            });
          };

          scope.getObjectFromArrayByRefObject = function (sourceArray, keyObject) {
            return sourceArray.filter(function (element) {
              return element.ref_obj_pk === keyObject.id
            });
          };

          scope.replaceObjectInArray = function (sourceArray, keyObject) {
            sourceArray.forEach(function (item, i) {
              if (item.id == keyObject.id) {
                sourceArray[i] = keyObject;
              }
            });
            return sourceArray;
          };

          scope.removeTeam = function (team) {
            var tmp = scope.userDetails[scope.currentUserId];

            scope.putUserToOriginalList(scope.currentUserId);

            tmp.myteam = scope.removeObjectFromArray(tmp.myteam, team)
            if (!tmp.changes.myteam) {
              tmp.changes.myteam = [];
            }
            tmp.changes.myteam.push({"id" : team.id, "status" :  "remove"});
            tmp.changes.isChanged = true;
            scope.userDetails[scope.currentUserId] = tmp;
          };

          scope.removeGroup = function (group) {
            var tmp = scope.userDetails[scope.currentUserId];

            scope.putUserToOriginalList(scope.currentUserId);

            tmp.myroles = scope.removeObjectFromArray(tmp.myroles, group)
            if (!tmp.changes.myroles) {
              tmp.changes.myroles = [];
            }
            tmp.changes.myroles.push({"id" : group.id, "status" :  "remove"});
            tmp.changes.isChanged = true;
            scope.userDetails[scope.currentUserId] = tmp;
          };

          scope.removeRight = function (right) {
            var tmp = scope.userDetails[scope.currentUserId];

            scope.putUserToOriginalList(scope.currentUserId);

            tmp.myrights = scope.removeObjectFromArray(tmp.myrights, right);
            if (!tmp.changes.myrights) {
              tmp.changes.myrights = [];
            }
            tmp.changes.myrights.push({"id" : right.id, "status" :  "remove"});
            tmp.changes.isChanged = true;
            scope.userDetails[scope.currentUserId] = tmp;
          };

          scope.removeTarget = function (right, target) {
            var tmp = scope.userDetails[scope.currentUserId];
            var selectedRight = scope.getObjectFromArray(tmp.myrights, right)[0];

            scope.putUserToOriginalList(scope.currentUserId);

            selectedRight.targets = scope.removeObjectFromArray(selectedRight.targets, target);
            tmp.myrights = scope.replaceObjectInArray(tmp.myrights, selectedRight)
            if (!tmp.changes.myrights) {
              tmp.changes.myrights = [];
            }
            var changeSelectedRight = scope.getObjectFromArray(tmp.changes.myrights, right)[0];
            if (!changeSelectedRight) {
              changeSelectedRight = {"id" : right.id, "status" :  "update", "targets": [{"id" : target.id, "status" :  "remove"}]};
              tmp.changes.myrights.push(changeSelectedRight);
            } else {
              changeSelectedRight.targets.push({"id" : target.id, "status" :  "remove"});
              tmp.changes.myrights = scope.replaceObjectInArray(tmp.changes.myrights, changeSelectedRight)
            }
            tmp.changes.myrights = scope.replaceObjectInArray(tmp.changes.myrights, changeSelectedRight)
            tmp.changes.isChanged = true;
            scope.userDetails[scope.currentUserId] = tmp;
          };

          scope.showInactive = function (user) {
            if (!scope.showInactiveUsers) {
              if (user.status_code != 'enabled') {
                return false;
              }
            }
            return true;
          };

          if (scope.showInactiveUsers) {
            scope.isEnabled = 'enabled';
          }
          else {
            scope.isEnabled = null;
          }

          // show modal

          scope.modalVisible = false;

          scope.setCurrentUserId= function (userId) {
            scope.currentUserId = userId;
          };

          scope.$watch('selectedChart', function (chart) {
            if (chart === null || chart == undefined) {
              scope.workChart = chart;
            }
            else {
              scope.workChart = {
                workchart: Lazy(chart.labels).last(),
                id: chart.id
              };
            }
          }, true);

          scope.$watch('addTeam', function () {
            if (scope.addTeam && scope.addTeam != "") {
              var newrole = {};
              newrole.id = scope.addTeam.id;
              newrole.display_label = newrole.label = scope.addTeam.label;
              var tmp = scope.userDetails[scope.currentUserId];
              var isTeamExists = scope.getObjectFromArray(tmp.myteam, newrole)[0];

              scope.putUserToOriginalList(scope.currentUserId);

              if (!isTeamExists) {
                tmp.myteam.push(newrole);
                var changes = tmp.changes;
                if (!changes.myteam) {
                  changes.myteam = [];
                }
                changes.myteam.push({"id" : newrole.id, "status" :  "add"});
                changes.isChanged = true;
                scope.userDetails[scope.currentUserId] = tmp;
              }

              scope.addTeam = "";
            }
           });

          scope.$watch('modalVisible', function () {
            if (!scope.modalVisible) {
              scope.teamModalVisible = false;
            }
          });

          scope.$watch('addGroup', function () {
            if (scope.addGroup && scope.addGroup != "") {
              var newrole = {};
              newrole.id = scope.addGroup.id;
              newrole.display_label = newrole.label = scope.addGroup.label;
              var tmp = scope.userDetails[scope.currentUserId];
              var isGroupExists = scope.getObjectFromArray(tmp.myroles, newrole)[0];

              scope.putUserToOriginalList(scope.currentUserId);

              if (!isGroupExists) {
                tmp.myroles.push(newrole);
                var changes = tmp.changes;
                if (!changes.myroles) {
                  changes.myroles = [];
                }
                changes.myroles.push({"id" : newrole.id, "status" :  "add"});
                changes.isChanged = true;
                scope.userDetails[scope.currentUserId] = tmp;
              }

              scope.addGroup = "";
            }
           });

          scope.$watch('addRightType', function () {
            if (scope.addRightType && scope.addRightType != "") {
              var newright = {};
              newright.id = scope.addRightType.id;
              newright.label= scope.addRightType.label;
              newright.target_kind_code = scope.addRightType.target_kind_code;
              newright.type = true;
              newright.is_direct = true;
              newright.targets = [];
              var tmp = scope.userDetails[scope.currentUserId];
              var isRightExists = scope.getObjectFromArrayByLabel(tmp.myrights, newright)[0];

              scope.putUserToOriginalList(scope.currentUserId);

              if (!isRightExists) {
                tmp.myrights.push(newright);
                var changes = tmp.changes;
                if (!changes.myrights) {
                  changes.myrights = [];
                }
                changes.myrights.push({"id" : newright.id, "status" :  "add", "targets": []});
                changes.isChanged = true;
                scope.userDetails[scope.currentUserId] = tmp;
              }

              scope.addRightType = "";
            }
          });

          scope.addWorkChart = function (right) {
            var target = scope.workChart;
            target['label'] = target['workchart'];
            var tmp = scope.userDetails[scope.currentUserId];
            var selectedRight = scope.getObjectFromArray(tmp.myrights, right)[0];
            var isTargetExists = scope.getObjectFromArrayByLabel(selectedRight.targets, target)[0];

            scope.putUserToOriginalList(scope.currentUserId);

            if (!isTargetExists) {
              selectedRight.targets = scope.addObjectToArray(selectedRight.targets, target);
              tmp.myrights = scope.replaceObjectInArray(tmp.myrights, selectedRight)
              if (!tmp.changes.myrights) {
                tmp.changes.myrights = [];
              }
              var changeSelectedRight = scope.getObjectFromArray(tmp.changes.myrights, right)[0];
              if (!changeSelectedRight) {
                changeSelectedRight = {"id" : right.id, "status" :  "update", "targets": [{"id" : target.id, "status" :  "add"}]};
                tmp.changes.myrights.push(changeSelectedRight);
              } else {
                changeSelectedRight.targets.push({"id" : target.id, "status" :  "add"});
                tmp.changes.myrights = scope.replaceObjectInArray(tmp.changes.myrights, changeSelectedRight)
              }
              tmp.changes.myrights = scope.replaceObjectInArray(tmp.changes.myrights, changeSelectedRight)
              tmp.changes.isChanged = true;
              scope.userDetails[scope.currentUserId] = tmp;
            }
          };

          scope.addTargets = function (right, targets) {
            scope.putUserToOriginalList(scope.currentUserId);

            for (var i = 0; i < targets.length; i++) {
              var tmp = scope.userDetails[scope.currentUserId];
              var selectedRight = scope.getObjectFromArray(tmp.myrights, right)[0];
              var target = targets[i];
              var isTargetExists = scope.getObjectFromArray(selectedRight.targets, target)[0];
              if (!isTargetExists) {
                selectedRight.targets = scope.addObjectToArray(selectedRight.targets, target);
                tmp.myrights = scope.replaceObjectInArray(tmp.myrights, selectedRight)
                if (!tmp.changes.myrights) {
                  tmp.changes.myrights = [];
                }
                var changeSelectedRight = scope.getObjectFromArray(tmp.changes.myrights, right)[0];
                if (!changeSelectedRight) {
                  changeSelectedRight = {"id" : right.id, "status" :  "update", "targets": [{"id" : target.id, "status" :  "add"}]};
                  tmp.changes.myrights.push(changeSelectedRight);
                } else {
                  changeSelectedRight.targets.push({"id" : target.id, "status" :  "add"});
                  tmp.changes.myrights = scope.replaceObjectInArray(tmp.changes.myrights, changeSelectedRight)
                }
                tmp.changes.myrights = scope.replaceObjectInArray(tmp.changes.myrights, changeSelectedRight)
                tmp.changes.isChanged = true;
                scope.userDetails[scope.currentUserId] = tmp;
              }
            }
          };

          scope.hideGroupModal = function () {
            scope.groupModalVisible = false;
          };

          scope.hideModal = function () {
            scope.teamModalVisible = false;
          };

          scope.putUserToOriginalList = function (userId, force) {
            if (typeof scope.originalUsers[userId] == 'undefined' || force === true) {
              scope.originalUsers[userId] = angular.copy(scope.userDetails[userId]);
            }
          };
        }
    };
});
