'use strict';

angular.module('angularApp')
  .directive('entry', function (appVersion) {
    return {
      templateUrl: 'views/_entry.html?v=' + appVersion.frontend,
      restrict: 'E',
      replace: true,
      scope: {
        entry: '=',
        cancelCallback: '=',
        saveCallback: '='
      },
      controller: ['$scope', '$timeout', '$location', '$routeParams', 'workEntries', 'gToast', 'history', 'workCharts', '$window', 'hoursInTheBank', 'currentUser', 'appVersion', 'hotkeys', function (
          $scope,
          $timeout,
          $location,
          $routeParams,
          workEntries,
          gToast,
          history,
          workCharts,
          $window,
          hoursInTheBank,
          currentUser,
	        appVersion,
          hotkeys) {
        $scope.chart = null;
        $scope.description = "";
        $scope.durations = [];
        $scope.notValid = true;
        $scope.fee_string = "$0.00";
        $scope.showHiddenCharts = false;
        $scope.showHiddenStatus= false;
        $scope.projects = null;
        $scope.hoursBusy = false;
        $scope.hoursWaiting = false;
        $scope.descriptionFocused = false;
        $scope.searchFocused = true;
        $scope.currentUser = currentUser.user;

        var _fetchHours = _.debounce(function(){
          if($scope.chart === undefined || $scope.chart === null) return;
          $scope.hoursWaiting = true;

          $timeout(function(){
            if($scope.hoursWaiting){
              $scope.hoursBusy = true;
            }
          }, 1000);

          hoursInTheBank.fetchBudgetFor($scope.chart).then(function(projects){
            $scope.projects = projects;
            $scope.hoursWaiting = false;
            $scope.hoursBusy = false;
          });
        });

        $scope.$watch('datePerformed', function(value, old) {
          if(value !== undefined) {
            localStorage['lastEntryCalendarMonth'] = JSON.stringify($scope.datePerformed);
          }
        });

        $scope.$watch('showHiddenStatus', function(){
          $scope.chart = null;
          $scope.showHiddenCharts = $scope.showHiddenStatus? true : false
        });

        $scope.$watch('chart', function(n, o){
          $scope.descriptionFocused = n !== undefined && n !== null;
          _fetchHours();
        });

        $scope.$watch('id', function(n, o){
          $scope.descriptionFocused = n !== null && n !== undefined;
          $scope.focus = n === null || n === undefined;
        });

        $scope.$watch('fee_string', function(fs){
          if(fs == "") return;
          else if(fs[0] == "$"){
            $scope.fee = parseFloat(fs.substring(1,9)) || 0;
          }
          else{
            $scope.fee = parseFloat(fs) || 0;
          }
        });

        $scope.feeFocus = function(){
          $scope.feeFocused = true;
        };

        $scope.descriptionFocus = function(){
          $scope.descriptionFocused = true;
        };

        $scope.$watch(function(){
          return {
            datePerformed: $scope.datePerformed,
            description: $scope.description,
            workChartId: $scope.chart ? $scope.chart.id : null,
            durations: $scope.durations
          }
        }, function(state, oldState){
          if(state === oldState) return;
          $scope.notValid = !(state.datePerformed != null &&
            state.description != null && state.description.trim() != "" &&
            state.workChartId != null &&
            state.durations.length > 0 && Lazy(state.durations).every(function(duration){
              return duration.kindCode != null && duration.kindCode.trim() != ""
            }))
        }, true);

        if($routeParams['year']) {
          $scope.datePerformed = $routeParams['year'] + "/" + $routeParams['month'] + "/" + $routeParams['day'];
        } else {
          workEntries.fetchEntry($scope.entry.id || $routeParams['id']).then(function(res){
            $scope.id = $scope.entry.id || $routeParams['id'];
            $scope.description = res.data.description;
            $scope.chart = workCharts.byId(res.data.work_chart_id);
            $scope.datePerformed = res.data.date_performed.split("-").join("/");
            $scope.durations = Lazy(res.data.work_entry_durations).map(function(d){
              return {
                id: d.id,
                hours: Math.floor(d.duration / 60),
                minutes: d.duration % 60,
                kindCode: d.kind_code
              }
            }).toArray();
            $scope.fee = parseFloat(res.data.work_entry_fees.length > 0 ? res.data.work_entry_fees[0].fee : 0);
            $scope.fee_string = "$" + $scope.fee.toFixed(2);
          });
        }

        $scope.cancel = function(event){
          if(event.x == 0 && event.y == 0) return; // a workaround to an issue with quick search hitting this cancel somehow
          // TODO: find out why and provide a more clean solution
          $scope.cancelCallback($scope.entry);
        };

        $scope.tryPersist = function() {
          // if a save request is in progress, do nothing
          if ($scope.isSaving) {
            return;
          }
          
          $scope.isSaving = true; // mark save as in progress
          
          if ($scope.id) {
            workEntries.update($scope).then(function(){
              $scope.isSaving = false;
              $scope.saveCallback($scope.entry);
            }, function(errorMessages){
              $scope.isSaving = false;
              gToast.open(JSON.stringify(errorMessages['data']['errors'].join(', ')) + "<br />Please contact #timesheet team");
            });
          } else {
            workEntries.createNew($scope)
              .success(function(){
                $scope.isSaving = false;
                $scope.saveCallback($scope.entry);
              })
              .error(function(errorMessages){
                $scope.isSaving = false;
                gToast.open(JSON.stringify(errorMessages['errors'].join(', ')) + "<br />Please contact #timesheet team");
              });
          }
        };

      	$scope.persistLocalState = function(){
      	  localStorage['entry'] = JSON.stringify({
                  id: $scope.id,
      	    chartId: ($scope.chart !== null && $scope.chart !== undefined) ? $scope.chart.id : null,
      	    datePerformed: $scope.datePerformed,
      	    durations: $scope.durations,
      	    description: $scope.description,
      	    fee_string: $scope.fee_string
      	  });
      	};

      	$scope.$on('appVersion.frontend.changed', function() {
      	  $scope.persistLocalState();
      	});

      	$scope.tryLoadLocalState = function(){
      	  if(localStorage['entry'] !== null && localStorage['entry'] !== undefined){
      	    var state = JSON.parse(localStorage['entry']);
      	    $scope.id = state.id;
      	    $scope.chart = workCharts.byId(state.chartId);
      	    $scope.datePerformed = state.datePerformed;
      	    $scope.fee_string = state.fee_string;
      	    $scope.description = state.description;
      	    $scope.durations = state.durations;
      	    localStorage.removeItem('entry');
      	  }
      	};

      	$timeout($scope.tryLoadLocalState, 500);

        $scope.$watch(function () {
          return currentUser.user;
        }, function (user) {
          $scope.currentUser = user;
        }, true);

        // hotkeys initialization
        hotkeys.bindTo($scope)
          .add({
            combo: 'alt+ctrl+enter',
            description: 'Save the entry',
            allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
            callback: function () {
              $scope.tryPersist();
            }
          })
          .add({
            combo: 'alt+ctrl+d',
            description: 'Focus on the description field',
            allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
            callback: function () {
              $scope.descriptionFocus();
            }
          })
          .add({
            combo: 'alt+ctrl+f',
            description: 'Focus on the fee field',
            allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
            callback: function () {
              $scope.feeFocus();
            }
          });
      }
    ]};
  });
