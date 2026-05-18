'use strict';

angular.module('angularApp')
  .controller('ReviewingDashboardCtrl', [ '$scope', 'reviews', 'workCharts', '$q', '$timeout', 'currentUser', 'team', 'users', 'helpers', 'gToast', function (
      $scope,
      reviews,
      workCharts,
      $q,
      $timeout,
      currentUser,
      team,
      users,
      helpers,
      gToast) {
    $scope.isFetchingEntries = true;
    $scope.entries = [];
    $scope.windowSize = 10;
    $scope.pageElementNumber = 10;
    $scope.onTopNow = false;
    $scope.monthsAbbr = {
        '01': 'Jan',
        '02': 'Feb',
        '03': 'Mar',
        '04': 'Apr',
        '05': 'May',
        '06': 'Jun',
        '07': 'Jul',
        '08': 'Aug',
        '09': 'Sept',
        '10': 'Oct',
        '11': 'Nov',
        '12': 'Dec'
    };
    $scope.monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
    ];
    $scope.roles = [];
    $scope.allRoles = [];
    $scope.showAll = false;
    $scope.roletags = [];
    $scope.teamItems = [];
    $scope.teamAllItems = [];
    $scope.selectedTeam = [];
    $scope.selectedProject = [];
    $scope.users = [];
    $scope.onlyRejectedStatus = false;
    $scope.periods = [];
    $scope.selectedPeriod = [];
    $scope.fetchedTeams = false;
    $scope.entriesUsers = [];
    $scope.entriesLoaded = false;

    $scope.$watch('selectedPeriod', function(){
      $scope.$broadcast('reviews-list-updated');
    });

    /**
     * Loading scope entries to review
     * @param  {array} entries
     * @return {void}
     */
    $scope.loadEntries = function (entries) {
      var dayByday = [];
      var day = [];
      var entry = {};
      var headerEntry = {};

      entries.map(function (entry) {
        if (typeof dayByday[entry.date_performed] == 'undefined') {
          dayByday[entry.date_performed] = [];
        }

        dayByday[entry.date_performed].push(entry);

        $scope.entriesUsers[entry.owner.id] = entry.owner.id;
      });

      entries = [];

      for (var index in dayByday) {
        day = dayByday[index];

        dayByday[index] = day.sort(function (a, b) {
          var keyA = a.owner.id;
          var keyB = b.owner.id;

          if(keyA < keyB) {
            return -1;
          }

          if(keyA > keyB) {
            return 1;
          }

          return 0;
        });
      }

      Object
        .keys(dayByday)
        .sort()
        .forEach(function (v) {
          day = dayByday[v];

          for (var indexD in day) {
            entry = day[indexD];

            if (indexD == '0' || entry.owner.id != day[parseInt(indexD) - 1].owner.id) {
              headerEntry = {};
              headerEntry.owner = entry.owner;
              headerEntry.date_performed = entry.date_performed;
              headerEntry.work_chart_id = entry.work_chart_id;
              headerEntry.durations = [];
              headerEntry.isHeader = true;

              entries.push(headerEntry);
            }

            entry.isHeader = false;

            entries.push(entry);
          }
        });

      entries = entries.map($scope.mapEntry);

      $scope.entries = entries;
      $scope.isFetchingEntries = false;
      setPeriods();
    };

    $scope.enlargeWindow = function(){
      $scope.windowSize = $scope.windowSize + 10;
    };

    /**
     * Fetching entries from a server
     * @return {void}
     */
    $scope.fetchEntries = function () {
      var deferred = $q.defer();

      reviews.fetchReviewEntries()
        .then(function (entries) {
          deferred.resolve(entries);
        });

      return deferred.promise;
    };

    /**
     * Accepting entry
     * @param  {object} entry
     * @return {void}
     */
    $scope.acceptEntry = function (entry, index) {
      reviews.acceptEntry(entry).then(function () {
        $scope.windowSize = index + 10;
        $scope.refreshEntries();
      });
    };

    $scope.refreshEntries = function () {
      $scope.fetchEntries()
        .then(function (entries) {
          $scope.entriesAll = entries;
          $scope.loadEntries(entries);
          $scope.entriesLoaded = true;
          $scope.setFilterTeams();
          $scope.setFilterProjects();
          $scope.$broadcast('reviews-list-updated');
          $scope.filterByProject($scope.selectedProject);
        });
    };

    $scope.undoLast = function () {
      reviews.undoLast().then(function() {
        $scope.refreshEntries();
      }, function(error) {
        gToast.open(error.errors.join("<br />"));
      });
    }

    $scope.acceptOld = function () {
      reviews.batchAccept($scope.acceptOlderThan).then(function() {
        $scope.refreshEntries();
        $scope.acceptOlderThan = null;
        $scope.showAcceptOlder = false;
      }, function(error) {
        gToast.open(error.errors.join("<br />"));
      });
    }

    /**
     * Opening a textbox for a rejection comment
     * @param  {object} entry
     * @return {[type]}       [description]
     */
    $scope.openRejectBox = function (entry) {
      entry.rejecting = true;
    };

    /**
     * Closing a rejecting box
     * @param  {object} entry
     * @return {void}
     */
    $scope.cancelRejection = function (entry) {
      entry.rejecting = false;
      entry.rejectionComment = '';
    };

    /**
     * Processing rejecting an entry
     * @param  {object} entry
     * @return {void}
     */
    $scope.rejectEntry = function (entry, index) {
      reviews.rejectEntry(entry).then(function () {
        $scope.windowSize = index + 10;
        $scope.refreshEntries();
      });
    };

    /**
     * Opening an entry editor
     * @param  {object} entry
     * @return {void}
     */
    $scope.openEditBox = function (entry) {
      entry.editing = true;
    }

    /**
     * Opening an entry editing box
     * @param  {object} entry
     * @return {void}
     */
    $scope.cancelEditing = function (entry) {
      entry.editing = false;
    };

    /**
     * Processing an entry update and reloading a list of entries
     * @param  {object} entry
     * @return {void}
     */
    $scope.saveEntry = function (entry) {
      var entryToInject = false;
      entry.editing = false;

      $scope.fetchEntries()
        .then(function (entries) {
          entries = entries.map($scope.mapEntry);

          entries.forEach(function (newEntry) {
            if (entry.id == newEntry.id) {
              entryToInject = newEntry;
            }
          });

          if (entryToInject !== false) {
            $scope.entries.forEach(function (oldEntry, index) {
              if (oldEntry.id == entry.id) {
                entryToInject.isHeader = false;
                $scope.entries[index] = entryToInject;

                return false;
              }
            });
          }
        });
    };

    /**
     * Map entry with all the necessary data
     * @param  {object} entry
     * @return {object}
     */
    $scope.mapEntry = function (entry) {
      var workChart = workCharts.byId(entry.work_chart_id, 'dead');
      var durationsSum = 0;
      var date = [];

      entry.own = false;

      if (entry.owner.email === currentUser.user.assumed_email) {
        entry.own = true;
      }

      entry.initChartLabels = workChart.labels.slice(0, workChart.labels.length - 1);
      entry.lastChartLabel = workChart.labels[workChart.labels.length - 1];

      date = entry.date_performed.split('-');
      entry.dayPerformed = date[2];
      entry.monthPerformed = $scope.monthsAbbr[date[1]];

      entry.durations.forEach(function (duration) {
        durationsSum += duration.duration;
      });

      entry.total = durationsSum / 60;
      entry.onTopNow = false;

      return entry;
    };

    /**
     * Reloading a roles model
     * @param  {String} query
     * @return {Deferred}
     */
    $scope.loadTags = function(query) {
      var deferred = $q.defer();
      var items = [];
      for (var i = 0; i < $scope.roles.length; i++) {
        if ($scope.roles[i].name.indexOf(query) == 0) {
          items.push($scope.roles[i]);
        }
      }
      deferred.resolve(items);
      return deferred.promise;
    };

    $scope.filterByProject = function(project) {
      if(project == undefined || project == '' || project === null){
        if($scope.entriesAll !== undefined && $scope.entriesAll !== null && $scope.entriesAll != []){
          $scope.loadEntries($scope.entriesAll);
        }
      }
      else{
        $scope.entries = Lazy($scope.entriesAll).filter(function(entry) {
          return !Lazy(entry.initChartLabels.concat([entry.lastChartLabel])).filter(function(l){
            return l == project.label;
          }).isEmpty();
        }).toArray();
        $scope.loadEntries($scope.entries);
      }
      $scope.$broadcast('reviews-list-updated');
    };

    $scope.$watch('selectedProject', $scope.filterByProject);

    $scope.setFilterProjects = function(){
      if ($scope.users.length === 0 || $scope.entriesLoaded === false) {
        return false;
      }

      $scope.projects = Lazy($scope.entriesAll.map(function(entry){
        return {
          id: entry.work_chart_id,
          labels: entry.initChartLabels.concat([entry.lastChartLabel])
        }
      }).map(function(chart){
        var label = "";
        if(chart.labels.indexOf('Clients') == -1){
          label = chart.labels[1];
        }
        else{
          label = chart.labels[2];
        };
        return {
          id: chart.id,
          label: label,
          code: label
        }
      })).uniq('label').toArray();
    };

    /**
     * Setting a teams list for the team filter
     * @return {mixed}
     */
    $scope.setFilterTeams = function () {
      if ($scope.users.length === 0 || $scope.entriesLoaded === false) {
        return false;
      }

      var teams = [];

      $scope.entriesUsers.forEach(function (user) {
        Lazy($scope.users).forEach(function (userL) {
          if (userL.id === user) {
            var userLTeams = _.filter($scope.teamAllItems, function(team) {
              return _.contains(userL.team_ids, team.id);
            });
            _.each(userLTeams, function(team) {
              teams[team.code] = team.id;
            });
          }
        });
      });

      teams = $scope.teamAllItems.filter(function (team) {
        if (teams[team.code] !== undefined) {
          return true;
        }

        return false;
      });

      $scope.teamItems = teams;
    };

    /**
     * Filtering roles auto-complete
     * @return {void}
     */
    var filterRoles = function () {
      if ($scope.showAll) {
        $scope.roles = $scope.allRoles;
      } else {
        $scope.roles = Lazy($scope.allRoles).filter(function (r) {
          return r.status_code == 'enabled';
        }).toArray();
      }
    };

    /**
     * Setting periods Date objects for the periods filter
     * @return {void}
     */
    var setPeriods = function () {
      var today = new Date();
      var beginningOfThisWeek = new Date(today);
      beginningOfThisWeek.setDate(today.getDate() - today.getDay());

      $scope.periods = Lazy($scope.entriesAll).map(function(entry){
        var date = new Date(Date.parse(entry.date_performed));
        var first = new Date(date);
        first.setDate(date.getDate() - date.getDay());
        return first;
      }).uniq(function(d){
        return d.toDateString();
      }).sortBy(function(d){
        return d.getTime();
      }).reverse().map(function(first){
        var last = new Date(first);
        last.setDate(first.getDate() + 6);
        var weeksAgo = Math.floor(Math.ceil(Math.abs(beginningOfThisWeek.getTime() - first.getTime()) / (1000 * 3600 * 24)) / 7);
        var label = weeksAgo == 0 ? "This week" : (weeksAgo == 1 ? "Last week" : (weeksAgo + " wks ago"));
        if(beginningOfThisWeek < first){
          label = "In the future";
        }
        return {
          label: label,
          from: first,
          to: last,
          code: label
        }
      }).toArray();
      if($scope.selectedPeriod && Lazy($scope.periods).find(function(period){ return period.code == $scope.selectedPeriod.code }) === undefined){
        $scope.selectedPeriod = null;
      }
    };

    currentUser.getAllRoles().then(function(roles){
      $scope.allRoles = Lazy(roles.data).map(function(role){
        var r = role;
        r.name = Lazy(r.display_label).drop(6).join('').toLowerCase();
        return r;
      }).toArray();

      filterRoles();
    });

    team.getTeams()
      .then(function (teams) {
        $scope.teamAllItems = Lazy(teams.data).map(function (d) {
          var member = d;
          member.value = member.code;
          return member;
        }).sortBy(function(t){
          return t.label;
        }).toArray();

        $scope.fetchedTeams = true;
    });

    // waiting for service data
    $scope.$watchCollection(function () {
      return [workCharts.dataLoaded, currentUser.user, $scope.fetchedTeams];
    }, function (value) {
      if (value[0] === true && value[1] != null && value[2] === true) {
        $scope.fetchEntries()
          .then(function (entries) {
            $scope.entriesAll = entries;
            $scope.loadEntries(entries);
            $scope.entriesLoaded = true;
            $scope.setFilterTeams();
            $scope.setFilterProjects();
          });

        users.getUsersWithDetails()
          .then(function (users) {
            $scope.users = users.data;
            $scope.setFilterTeams();
            $scope.setFilterProjects();
          });
      }
    });

    $scope.$watch('showAll', function(value) {
      filterRoles();
    });

    setPeriods();
  }]);
