'use strict';

angular.module('angularApp')
  .controller('WorkChartsEditorCtrl', function ($scope, $q, gToast, workCharts, users, $timeout, rights, helpers, currentUser, $routeParams, settings) {
    $scope.possibleParents = workCharts.possibleParents.toArray();
    $scope.durationKinds = [];
    $scope.kindsInheritedFrom = undefined;
    $scope.activeKinds = [];
    $scope.workChart = undefined;
    $scope.selectedChart = undefined;
    $scope.chartChildren = [];
    $scope.isSelectedChartUpdated = true;
    $scope.workChartManagers = [];
    $scope.users = [];
    $scope.disableManagersMultiPick = false;
    $scope.currentUser = currentUser.user;

    $scope.tabs = [
      { code: 'general', title: 'General' },
      { code: 'children', title: 'Children' },
      { code: 'managers', title: 'Managers' },
      { code: 'transactions', title: 'Transactions' }
    ];

    $scope.tab = $scope.tabs[0];

    var refreshKindsFor = function(chart){
      workCharts.kindsFor(chart).success(function(kinds){
        $scope.durationKinds = workCharts.durationKinds.map(function(durationKind){
          var kind = Lazy(kinds).find(function(k){ return k.code == durationKind.code; });
          var k = durationKind;
          k.isDefault = kind !== undefined && kind.is_default;
          k.isInherited = kind !== undefined && kind.is_inherited;
          k.isActive = kind !== undefined;
          k.displayLabel = k.display_label;
          return k;
        }).toArray();
        if(kinds[0].inherited_from_id !== undefined && kinds[0].inherited_from_id !== chart.id){
          $scope.kindsInheritedFrom = workCharts.byId(kinds[0].inherited_from_id, 'dead');
          if($scope.kindsInheritedFrom.labels.length == 1){
            $scope.kindsInheritedFrom.displayLabel = $scope.kindsInheritedFrom.labels[0];
          }
          else{
            $scope.kindsInheritedFrom.displayLabel = Lazy($scope.kindsInheritedFrom.labels).drop(1).join(" - ");
          }
          $scope.kindsInheritedFrom.label = $scope.kindsInheritedFrom.title;
          $scope.kindsInheritedFrom.parent_id = $scope.kindsInheritedFrom.parentId;
        }else{
          $scope.kindsInheritedFrom = undefined;
        }
        $scope.syncKindActive();
      });
    };

    $scope.syncKindDefault = function(kind){
      Lazy($scope.editingKinds).each(function(k){
        k.isDefault = k.code === kind.code;
      });
    };

    $scope.syncKindActive = function(kind){
      if(kind !== undefined && kind !== null && !kind.isActive && kind.isDefault){
        var nextDefault = Lazy($scope.editingKinds).find(function(k){
          return k.code !== kind.code && k.isActive;
        });
        if(nextDefault !== undefined){
          $scope.syncKindDefault(nextDefault);
        }
      }
      $scope.activeKinds = Lazy($scope.editingKinds).filter(function(k){
        return k.isActive;
      }).toArray();
    };

    var refreshChildren = function(chart){
      if(chart === undefined){
        chart = $scope.workChart;
      }
      if(chart === undefined || chart === null) return;
      $scope.chartChildren = workCharts.allByParentId(chart.id).toArray();
      workCharts.getHeirsFor(chart).success(function(heirs){
        Lazy($scope.chartChildren).each(function(c){
          c.inheritsSet = false;
        });
        Lazy(heirs).each(function(heir){
          var heirChart = Lazy($scope.chartChildren).find(function(c){
            return c.title == heir;
          });
          if(heirChart !== undefined){
            heirChart.inheritsSet = true;
          }
        });
      });
    };

    $scope.saveChart = function(){
      var q = $q.defer();
      if($scope.chartChanged){
        $scope.savingChart = true;
        workCharts.saveChart($scope.editingChart).success(function(){
          $scope.savingChart = false;
          $scope.workChart = $scope.selectedChart = JSON.parse(JSON.stringify($scope.editingChart));
          workCharts.refreshQuicks();
          q.resolve();
        }).error(function(data){
          $scope.savingChart = false;
          gToast.open(data.errors);
          q.resolve();
        });
      }
      else{
        setTimeout(function(){ q.resolve(); }, 100);
      }
      return q.promise;
    };

    $scope.deleteChart = function(){
      $scope.deletingChart = true;
      workCharts.deleteChart($scope.workChart).success(function(){
        var parent = workCharts.byId($scope.workChart.parentId || $scope.workChart.parent_id, "dead");
        $scope.workChart = parent;
        $scope.deletingChart = false;
      }).error(function(data){
        gToast.open(data.errors);
        $scope.deletingChart = false;
      });
    };

    $scope.clearSet = function(){
      $scope.clearingKinds = true;
      workCharts.clearKindsFor($scope.workChart).success(function(){
        refreshKindsFor($scope.workChart);
        $scope.clearingKinds = false;
      }).error(function(data){
        gToast.open(data.errors);
        $scope.clearingKinds = false;
      });
    };

    $scope.saveKinds = function(){
      if($scope.kindsChanged){
        $scope.savingKinds = true;
        workCharts.saveKinds($scope.editingKinds, $scope.editingChart).success(function(){
          refreshKindsFor($scope.workChart);
          $scope.savingKinds = false;
        }).error(function(){
          $scope.savingKinds = false;
        });
      }
    };

    $scope.save = function(){
      $scope.saveChart().then($scope.saveKinds);
    };

    $scope.addChild = function(){
      $scope.addingChart = true;
      workCharts.createChild($scope.newChartTitle, $scope.workChart).success(function(data){
        if($scope.isSelectedChartUpdated) {
          $scope.newChartTitle = "";
          $scope.addingChart = false;
          $scope.selectedChart = data.chart;
        } else {
          $scope.newChartTitle = "";
          $scope.addingChart = false;
        }

        // when creating a new client put General node automatically under the client node
        if(data.chart.parent_id == settings.work_chart_clients_id) {
          $scope.newChartTitle = "General";
          $scope.workChart = data.chart;
          $scope.isSelectedChartUpdated = false;
          $scope.addChild();
        }
        else {
          $scope.isSelectedChartUpdated = true;
        }
      }).error(function(data){
        gToast.open(data.errors);
        $scope.addingChart = false;
      });
    };

    /**
     * Load multi-pick auto-complete users list
     * @param  {string} query
     * @return {$q}
     */
    $scope.loadUsers = function(query) {
      var deferred = $q.defer();
      var items = [];

      for (var i = 0; i < $scope.users.length; i++) {
        if ($scope.users[i].name != null && $scope.users[i].name.toLowerCase().indexOf(query.toLowerCase()) != -1) {
          $scope.users[i]['name'] = $scope.users[i]['name'];
          $scope.users[i]['label'] = $scope.users[i]['name'];

          items.push($scope.users[i]);
        }
      }

      deferred.resolve(items);

      return deferred.promise;
    };

    /**
     * Add manager to the work chart
     * @param {object} user
     * @return {void}
     */
    $scope.addManagerToWorkChart = function (user) {
      $scope.disableManagersMultiPick = true;

      // getting corresponding user object
      var user = $scope.users.filter(function (userL) {
        if (userL.id === user.id) {
          return true;
        }

        return false;
      });
      user = user[0];

      // looking for manager rights
      var userManagerRight = user.myrights.filter(function (right) {
        if (right.code === $scope.projectManagerRightType.code) {
          return true;
        }

        return false;
      });

      // trying to add a right
      if (userManagerRight.length > 0) {
        var changes = {
          isChanged: true,
          myrights: [
            {
              id: userManagerRight[0].id, // manage project right type
              status: 'update',
              targets: [
                {
                  id: $scope.workChart.id,
                  status: 'add'
                }
              ]
            }
          ]
        };
      } else {
        var changes = {
        isChanged: true,
          myrights: [
            {
              id: $scope.projectManagerRightType.id,
              status: 'add',
              targets: [
                {
                  id: $scope.workChart.id,
                  status: 'add'
                }
              ]
            }
          ]
        };
      }

      users.updateUser(changes, user.id)
        .then(function () {
            users.getUsersWithDetails()
              .then(function (users) {
                $scope.users = helpers.toArray(users.data);
                $scope.disableManagersMultiPick = false;
              });
          });
    };

    /**
     * Remove manager from the work chart
     * @param  {object} user
     * @return {void}
     */
    $scope.removeManagerFromWorkChart = function (user) {
      $scope.disableManagersMultiPick = true;

      // getting corresponding user object
      var user = $scope.users.filter(function (userL) {
        if (userL.id === user.id) {
          return true;
        }

        return false;
      });
      user = user[0];

      // looking for manager rights
      var userManagerRight = user.myrights.filter(function (right) {
        if (right.code === $scope.projectManagerRightType.code) {
          return true;
        }

        return false;
      });

      // trying to remove a right
      if (userManagerRight.length > 0) {
        if (userManagerRight[0].targets.length > 1) {
          var currentTargetRight = userManagerRight[0].targets.filter(function (target) {
            if (target.ref_obj_pk == $scope.workChart.id) {
              return true;
            }

            return false;
          });

          var changes = {
              isChanged: true,
              myrights: [
                {
                  id: userManagerRight[0].id,
                  status: 'update',
                  targets: [
                    {
                      id: currentTargetRight[0].id,
                      status: 'remove'
                    }
                  ]
                }
              ]
            };
        } else {
          var changes = {
              isChanged: true,
              myrights: [
                {
                  id: userManagerRight[0].id,
                  status: 'remove'
                }
              ]
            };
        }

        users.updateUser(changes, user.id)
          .then(function () {
            users.getUsersWithDetails()
              .then(function (users) {
                $scope.users = helpers.toArray(users.data);
                $scope.disableManagersMultiPick = false;
              });
          });
      }
    };

    /**
     * Load current work chart maangers list
     * @return {void}
     */
    $scope.loadManagers = function () {
      $scope.workChartManagers = [];

      if($scope.projectManagerRightType === undefined || $scope.projectManagerRightType === null) {
        return;
      }

      $scope.users.forEach(function (user) {
        var managerRights = user.myrights.filter(function (right) {
          if (right.code == $scope.projectManagerRightType.code) {
            var targets = right.targets.filter(function (target) {
              if (target.ref_obj_pk == $scope.workChart.id) {
                return true;
              }
            });

            if (targets.length > 0) {
              return true;
            }
          }
        });

        if (managerRights.length > 0) {
          $scope.workChartManagers.push(user);
        }
      });
    };

    var initParms = function () {
      if ($routeParams['work_chart_id']) {
        $scope.selectedChart = workCharts.byId($routeParams['work_chart_id'], 'dead');
      }

      if ($routeParams['selected_tab']) {
        var indexTab = false;

        $scope.tabs.forEach(function (item, index) {
          if (item.code == $routeParams['selected_tab']) {
            indexTab = index;
          }
        });

        if (indexTab) {
          $scope.tab = $scope.tabs[indexTab];
        }
      }
    };

    $scope.$watch('durationKinds', function(kinds){
      if(kinds === undefined || kinds === null){
        $scope.editingKinds = kinds;
      }
      else {
        $scope.editingKinds = JSON.parse(JSON.stringify(kinds));
      }
      $scope.syncKindActive();
    });

    $scope.$watch('selectedChart', function(chart){
      if(chart == 'null') {
        $scope.selectedChart = $scope.workChart;
      }
      else if(chart === null || chart == undefined){
        $scope.workChart = chart;
      }
      else {
        $scope.workChart = {
          labels: chart.labels,
          dontSendEmptyReports: chart.dontSendEmptyReports,
          label: Lazy(chart.labels).last(),
          parent_id: chart.parentId,
          status: chart.status,
          id: chart.id
        };
        refreshKindsFor(chart);
        refreshChildren(chart);

        $scope.loadManagers();
      }
    }, true);

    $scope.$watch('workChart', function(chart){
      if(chart === undefined || chart === null){
        $scope.editingChart = chart;
      }
      else {
        $scope.editingChart = JSON.parse(JSON.stringify(chart));
      }
    }, true);

    $scope.$watch('editingChart', function(chart){
      $scope.chartChanged = JSON.stringify($scope.workChart) != JSON.stringify(chart);
    }, true);

    $scope.$watch('newChartTitle', function(title){
      $scope.newChartTitleValid = title !== undefined && title.trim() != '' &&
        Lazy($scope.chartChildren).find(function(t){
          return t.title == title;
        }) === undefined;
    });

    $scope.$watch('editingChart.dontSendEmptyReports', function(setting) {
      if(setting !== null && setting !== undefined &&
         $scope.workChart.dontSendEmptyReports != $scope.editingChart.dontSendEmptyReports) {
        $scope.saveChart().then(function(){
          gToast.open("Setting successfully updated");
        }).error(function(data){
          gToast.open(data.errors);
        });
      }
    });

    $scope.$watch('editingKinds', function(kinds){
      var toSimple = function(l){
        return {
          c: l.code,
          a: l.isActive,
          d: l.isDefault
        }
      };
      $scope.kindsChanged = JSON.stringify(Lazy($scope.durationKinds).map(function(k){ return toSimple(k); }).toArray()) !=
        JSON.stringify(Lazy(kinds).map(function(k) { return toSimple(k); }).toArray());
    }, true);

    $scope.$watch(function(){
      return workCharts.rawPossibleParents;
    }, function(){
      $scope.possibleParents = workCharts.possibleParents.toArray();
    });

    $scope.$watch(function(){
      return workCharts.version;
    }, function(){
      refreshChildren($scope.workChart);
    }, true);

    $scope.$watch(function () {
      return currentUser.user;
    }, function (user) {
      $scope.currentUser = user;
    }, true);

    workCharts.refreshAbleToBeParents();
    workCharts.refreshDurationKinds();

    users.getUsersWithDetails()
      .then(function (users) {
        $scope.users = helpers.toArray(users.data);
      });

    rights.getRightTypeByCode('project_manage')
      .then(function (rightType) {
        $scope.projectManagerRightType = rightType.data;
      });

    initParms();
  });
