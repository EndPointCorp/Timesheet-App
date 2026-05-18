'use strict';

angular.module('angularApp').directive('groupDetails', function ($timeout, $rootScope, currentUser, $q, $filter, paginationService, groups, gToast, confirmUnsavedChanges) {
    return {
        restrict: 'E',
        scope: {
          groupDetails: "=",
          buttonItems: "=",
          groupItems: "=",
          rightTypeItems: "=",
          searchGroup: "=",
          filterRole: "=",
          allICRoles: '=',
          allICUsers: '='
        },
        templateUrl: 'views/_groupDetails.html',
        link: function(scope, element, attrs) {
          scope.filteredGroupDetailsList = []
          scope.searchGroup = "";
          scope.custom = false;
          scope.modified = false;
          scope.timeZones = [];
          scope.workChart = undefined;
          scope.selectedChart = undefined;
          scope.groupDetailsList = [];
          scope.isShowAll = false;
          scope.groupsDetailsInitial = [];
          scope.originalGroups = {};

          scope.currentPage = 1;
          scope.pageSize = 25;
          scope.pageGroupChangeHandler = function(num) {};

          confirmUnsavedChanges(scope);

          scope.callGroupUpdate = function() {
            var page = paginationService.getCurrentPage('__groups');
            if(page) {
              var num = parseInt(page, 10);
              if(num ==0) {
                num = 1
              }
              paginationService.setCurrentPage('__groups', num);
            } else {
              paginationService.setCurrentPage('__groups', 1);
            }
          };

          scope.$watchGroup(['searchGroup', 'filterRole'], function() {
            scope.applyFilterOnGroups();
          });

          scope.$on('group:updated', function(event) {
            scope.groupDetailsList = [];
          });

          scope.$watch('groupDetails', function (items) {
            var initialFilter = false;

            if(scope.groupDetailsList.length == 0) {
              initialFilter = true;
            }

            scope.groupDetailsList = [];
            angular.forEach(items, function(value, key) {
              scope.groupDetailsList.push(value);
            });

            if(initialFilter) {
              scope.filteredGroupDetailsList = scope.groupDetailsList;
              scope.applyFilterOnGroups();
            }
          }, true);

          scope.applyFilterOnGroups = function() {
            scope.currentPage=0;
            scope.filteredGroupDetailsList = scope.groupDetailsList;

            if(scope.groupDetailsList.length > 0) {
              scope.filteredGroupDetailsList = $filter('filter')(scope.groupDetailsList, {label: scope.searchGroup});
              scope.filteredGroupDetailsList = $filter('orderBy')(scope.filteredGroupDetailsList, "label");
              scope.filteredGroupDetailsList = $filter('filterByRole')(scope.filteredGroupDetailsList, 'myroles', scope.filterRole);
            } else {
              scope.filteredGroupDetailsList = []
            }

            scope.totalPages = Math.ceil(scope.filteredGroupDetailsList.length / scope.pageSize);
          };

          scope.loadRoles = function (query) {
            var deferred = $q.defer();
            var items = [];

            for (var i = 0; i < scope.allICRoles.length; i++) {
              if (scope.allICRoles[i]['label'].toLowerCase().indexOf(query) == 0) {
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
              if (scope.allICUsers[i].username.indexOf(query) == 0) {
                scope.allICUsers[i]['name'] = scope.allICUsers[i]['username'];
                scope.allICUsers[i]['label'] = scope.allICUsers[i]['username'];
                items.push(scope.allICUsers[i]);
              }
            }

            deferred.resolve(items);

            return deferred.promise;
          };

          scope.cancelChanges = function(groupId) {
            var tmp = _.find(scope.groupDetails, function(g) { return g.id == scope.currentGroupId });
            _.assign(tmp, scope.originalGroups[groupId]);
            scope.groupDetailsList = [];
          };

          scope.saveChanges = function (changes, groupId) {
            groups.updateGroup(changes, groupId)
              .then(function () {
                $rootScope.$broadcast('group:persisted', function(){
                  $timeout(scope.applyFilterOnGroups, 1500);
                });

                gToast.open('Group saved successfully.');
            }, function (errorMessages) {
               gToast.open('Could not update a group entity. <br />Please contact the TimesheetApp development team');
            });
          };

          scope.setName = function() {
            var tmp = _.find(scope.groupDetails, function(det) { return det.id == scope.currentGroupId; });

            scope.putGroupToOriginalList(scope.currentGroupId);

            tmp.changes.label = tmp.label;
            tmp.changes.isChanged = true;
            scope.groupDetails[scope.currentGroupId] = tmp;
          };

          scope.addObjectToArray = function(sourceArray, keyObject) {
            sourceArray.push(keyObject);
            return sourceArray;
          };

          scope.removeObjectFromArray = function(sourceArray, keyObject) {
            return sourceArray.filter(function(element) {
              return element.id !== keyObject.id
            });
          };

          scope.getObjectFromArray = function(sourceArray, keyObject) {
            return sourceArray.filter(function(element) {
              return element.id === keyObject.id
            });
          };

          scope.getObjectFromArrayByLabel = function(sourceArray, keyObject) {
            return sourceArray.filter(function(element) {
              return element.label === keyObject.label
            });
          };

          scope.replaceObjectInArray = function(sourceArray, keyObject) {
            sourceArray.forEach(function(item, i) {
              if (item.id == keyObject.id) {
                sourceArray[i] = keyObject;
              }
            });

            return sourceArray;
          };

          scope.removeGroup = function(group) {
            var tmp = _.find(scope.groupDetails, function(det) { return det.id == scope.currentGroupId; });

            scope.putGroupToOriginalList(scope.currentGroupId);

            tmp.myroles = scope.removeObjectFromArray(tmp.myroles, group);

            if(!tmp.changes.myroles) {
              tmp.changes.myroles = [];
            }

            tmp.changes.myroles.push({
              "id" : group.id,
              "status" :  "remove"
            });
            tmp.changes.isChanged = true;
          };

          scope.removeRight = function(right) {
            var tmp = _.find(scope.groupDetails, function(det) { return det.id == scope.currentGroupId; });

            scope.putGroupToOriginalList(scope.currentGroupId);

            tmp.myrights = scope.removeObjectFromArray(tmp.myrights, right);

            if (!tmp.changes.myrights) {
              tmp.changes.myrights = [];
            }

            tmp.changes.myrights.push({
              "id" : right.id,
              "status" :  "remove"
            });
            tmp.changes.isChanged = true;
          };

          scope.removeTarget = function(right, target) {
            var tmp = _.find(scope.groupDetails, function(det) { return det.id == scope.currentGroupId; });
            var selectedRight = scope.getObjectFromArray(tmp.myrights, right)[0];

            scope.putGroupToOriginalList(scope.currentGroupId);

            selectedRight.targets = scope.removeObjectFromArray(selectedRight.targets, target);
            tmp.myrights = scope.replaceObjectInArray(tmp.myrights, selectedRight);

            if (!tmp.changes.myrights) {
              tmp.changes.myrights = [];
            }

            var changeSelectedRight = scope.getObjectFromArray(tmp.changes.myrights, right)[0];

            if (!changeSelectedRight) {
              changeSelectedRight = {
                "id" : right.id,
                "status" :  "update",
                "targets": [{
                  "id" : target.id,
                  "status" :  "remove"
                }]
              };
              tmp.changes.myrights.push(changeSelectedRight);
            } else {
              changeSelectedRight.targets.push({"id" : target.id, "status" :  "remove"});
              tmp.changes.myrights = scope.replaceObjectInArray(tmp.changes.myrights, changeSelectedRight)
            }

            tmp.changes.myrights = scope.replaceObjectInArray(tmp.changes.myrights, changeSelectedRight)
            tmp.changes.isChanged = true;
          };

          // show modal

          scope.modalVisible = false;

          scope.setCurrentGroupId= function(groupId) {
            scope.currentGroupId = groupId;
          };

          scope.$watch('selectedChart', function(chart) {
            if (chart === null || chart == undefined) {
              scope.workChart = chart;
            } else {
              scope.workChart = {
                workchart: Lazy(chart.labels).last(),
                id: chart.id
              };
            }
          }, true);

          scope.$watch('modalVisible', function(){
            if(!scope.modalVisible) {
              scope.teamModalVisible = false;
            }
          });

          scope.$watch('addGroup', function() {
            if(scope.addGroup && scope.addGroup != "") {
              var newrole = {};
              newrole.id = scope.addGroup.id;
              newrole.label = scope.addGroup.label;
              newrole.isDirect = true;
              var tmp = _.find(scope.groupDetails, function(g) { return g.id == scope.currentGroupId });
              var isGroupExists = scope.getObjectFromArray(tmp.myroles, newrole)[0];

              scope.putGroupToOriginalList(scope.currentGroupId);

              if(!isGroupExists) {
                tmp.myroles.push(newrole);
                var changes = tmp.changes;
                if(!changes.myroles) {
                  changes.myroles = [];
                }
                changes.myroles.push({"id" : newrole.id, "status" :  "add"});
                changes.isChanged = true;
              }

              tmp.isChanged = true;
              scope.addGroup = "";
            }
           });

          scope.$watch('addRightType', function() {
            if(scope.addRightType && scope.addRightType != "") {
              var newright = {};
              newright.id = scope.addRightType.id;
              newright.label= scope.addRightType.label;
              newright.target_kind_code = scope.addRightType.target_kind_code;
              newright.type = true;
              newright.is_direct = true;
              newright.targets = [];
              var tmp = _.find(scope.groupDetails, function(g) { return g.id == scope.currentGroupId });
              var isRightExists = scope.getObjectFromArrayByLabel(tmp.myrights, newright)[0];

              scope.putGroupToOriginalList(scope.currentGroupId);

              if(!isRightExists) {
                tmp.myrights.push(newright);
                var changes = tmp.changes;
                if(!changes.myrights) {
                  changes.myrights = [];
                }
                changes.myrights.push({"id" : newright.id, "status" :  "add", "targets": []});
                changes.isChanged = true;
              }

              scope.addRightType = "";
            }
          });

          scope.addWorkChart = function(right) {
            var target = scope.workChart;
            target['label'] = target['workchart'];
            var tmp = _.find(scope.groupDetails, function(g) { return g.id == scope.currentGroupId });
            var selectedRight = scope.getObjectFromArray(tmp.myrights, right)[0];
            var isTargetExists = scope.getObjectFromArray(selectedRight.targets, target)[0];

            scope.putGroupToOriginalList(scope.currentGroupId);

            if(!isTargetExists) {
              selectedRight.targets = scope.addObjectToArray(selectedRight.targets, target);
              tmp.myrights = scope.replaceObjectInArray(tmp.myrights, selectedRight)
              if(!tmp.changes.myrights) {
                tmp.changes.myrights = [];
              }
              var changeSelectedRight = scope.getObjectFromArray(tmp.changes.myrights, right)[0];
              if(!changeSelectedRight){
                changeSelectedRight = {"id" : right.id, "status" :  "update", "targets": [{"id" : target.id, "status" :  "add"}]};
                tmp.changes.myrights.push(changeSelectedRight);
              } else {
                changeSelectedRight.targets.push({"id" : target.id, "status" :  "add"});
                tmp.changes.myrights = scope.replaceObjectInArray(tmp.changes.myrights, changeSelectedRight)
              }
              tmp.changes.myrights = scope.replaceObjectInArray(tmp.changes.myrights, changeSelectedRight)
              tmp.changes.isChanged = true;
            }
          };

          scope.addTargets = function(right, targets) {
            scope.putGroupToOriginalList(scope.currentGroupId);

            for (var i = 0; i < targets.length; i++) {
              var tmp = _.find(scope.groupDetails, function(g) { return g.id == scope.currentGroupId });
              var selectedRight = scope.getObjectFromArray(tmp.myrights, right)[0];
              var target = targets[i];
              var isTargetExists = scope.getObjectFromArray(selectedRight.targets, target)[0];
              if(!isTargetExists) {
                selectedRight.targets = scope.addObjectToArray(selectedRight.targets, target);
                tmp.myrights = scope.replaceObjectInArray(tmp.myrights, selectedRight)
                if(!tmp.changes.myrights) {
                  tmp.changes.myrights = [];
                }
                var changeSelectedRight = scope.getObjectFromArray(tmp.changes.myrights, right)[0];
                if(!changeSelectedRight){
                  changeSelectedRight = {"id" : right.id, "status" :  "update", "targets": [{"id" : target.id, "status" :  "add"}]};
                  tmp.changes.myrights.push(changeSelectedRight);
                } else {
                  changeSelectedRight.targets.push({"id" : target.id, "status" :  "add"});
                  tmp.changes.myrights = scope.replaceObjectInArray(tmp.changes.myrights, changeSelectedRight)
                }
                tmp.changes.myrights = scope.replaceObjectInArray(tmp.changes.myrights, changeSelectedRight)
                tmp.changes.isChanged = true;
              }
            }
          };

          scope.hideGroupModal = function() {
            scope.groupModalVisible = false;
          };

          scope.hideModal = function() {
            scope.teamModalVisible = false;
          };

          scope.putGroupToOriginalList = function (groupId, force) {
            if (typeof scope.originalGroups[groupId] == 'undefined' || force === true) {
              var tmp = _.find(scope.groupDetails, function(g) { return g.id == scope.currentGroupId });
              scope.originalGroups[groupId] = angular.copy(tmp);
            }
          };
        }
    };

});

