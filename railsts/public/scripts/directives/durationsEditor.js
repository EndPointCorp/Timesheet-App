'use strict';

angular.module('angularApp')
.directive('durationsEditor', function(appVersion) {
  return {
    templateUrl: 'views/_durationsEditor.html?v=' + appVersion.frontend,
    restrict: 'E',
    replace: true,
    scope: {
      chart: "=chart",
      durations: "=durations"
    },
    controller: function($scope, workCharts, $routeParams, hotkeys) {
      $scope.editingDurations = [ {
        kindCode: undefined,
        title: undefined,
        hours: 0,
        minutes: 0,
        availableKinds: []
      } ];
      $scope.kinds = [];
      $scope.canAddDuration = true;
      $scope.canRemoveDuration = false;
      $scope.isNewItem = $routeParams['year'];

      $scope.durationMatchesMinutes = function(duration, minute) {
        return duration.minutes == parseInt(minute);
      };

      $scope.setDurationMinutes = function(duration, minute) {
        duration.minutes = parseInt(minute);
      };

      $scope.addMinutes = function () {
        var firstDuration = Lazy($scope.editingDurations).first();
        if (firstDuration.minutes < 45) {
          firstDuration.minutes += 15;
        } else {
          firstDuration.minutes = 0;
          firstDuration.hours += 1;
        }
      };

      $scope.decreaseMinutes = function () {
        var firstDuration = Lazy($scope.editingDurations).first();
        if (firstDuration.minutes > 0) {
          firstDuration.minutes -= 15;
        } else {
          if (firstDuration.hours > 0) {
            firstDuration.minutes = 45;
            firstDuration.hours -= 1;
          }
        }
      };

      $scope.addHour = function () {
        var firstDuration = Lazy($scope.editingDurations).first();
        if (firstDuration.hours < 12) {
          firstDuration.hours += 1;
        }
      };

      $scope.decreaseHour = function () {
        var firstDuration = Lazy($scope.editingDurations).first();
        if (firstDuration.hours > 0) {
          firstDuration.hours -= 1;
        }
      };

      var refreshKinds = function(chart){
        if(chart == null || chart == undefined) return;
        workCharts.kindsFor(chart, function(kinds){
          $scope.kinds = Lazy(kinds).map(function(kind){
            return {
              kindCode: kind.code,
              title: kind.display_label,
              hours: 0,
              minutes: 0,
              isDefault: kind.is_default
            }
          }).toArray();
        });
      };

      var updateAvailableKindsFor = function(duration, kinds){
        var chosenKinds = Lazy($scope.editingDurations).map(function(d){ return d.kindCode; }).toArray();
        duration.availableKinds = Lazy(kinds).filter(function(k){
          return k.kindCode == duration.kindCode || Lazy(chosenKinds).find(function(ck){ return ck == k.kindCode; }) == undefined
        }).toArray();
        return duration;
      };

      var updateAvailableKinds = function(){
        var kinds = $scope.kinds;
        $scope.editingDurations = Lazy($scope.editingDurations).map(function(d){
          return updateAvailableKindsFor(d, kinds);
        }).toArray();
      };

      $scope.$watch('kinds', function(kinds){
        if(kinds.length == 0) return;
        var forAnyKind = function(duration){
          return Lazy(kinds).find(function(kind){
            return duration.kindCode == undefined || duration.kindCode == null || kind.kindCode == duration.kindCode;
          }) != undefined;
        };

        var durations = Lazy($scope.editingDurations).
          filter(forAnyKind).
          map(function(d){ return updateAvailableKindsFor(d, kinds); }).
          toArray()
        $scope.editingDurations = durations;
        if($scope.editingDurations.length == 0) $scope.addNewDuration();
        if(durations.length > 0 && $scope.isNewItem){
          var defaultKind = getDefaultKind();

          $scope.editingDurations[0].kindCode = defaultKind.kindCode;
        }
        var firstDuration = Lazy($scope.editingDurations).first(),
            fHours = 0,
            fMinutes = 0;
        Lazy($scope.durations).each(function(duration){
          var matched = false;
          Lazy($scope.editingDurations).each(function(editingDuration){
            if(duration.kindCode === editingDuration.kindCode){
              matched = true;
            }
          });
          if (!matched) {
            if (duration.hours) fHours += parseInt(duration.hours);
            if (duration.minutes) fMinutes += parseInt(duration.minutes);
          }
        });
        while ((fMinutes / 15) > 3){
          fHours += 1;
          fMinutes -= 60;
        }
        if (fHours) firstDuration.hours = fHours;
        if (fMinutes) firstDuration.minutes = fMinutes;
      });

      $scope.addNewDuration = function(){
        $scope.editingDurations.push({
          kindCode: undefined,
          title: undefined,
          hours: 0,
          minutes: 0
        });
        updateAvailableKinds();
        var last = Lazy($scope.editingDurations).last();
        last.kindCode = last.availableKinds[0].kindCode;
        return false;
      };

      $scope.removeDuration = function(duration){
        $scope.editingDurations = Lazy($scope.editingDurations).filter(function(d){
          return d.kindCode != duration.kindCode;
        }).toArray();
        if($scope.editingDurations.length == 0) $scope.addNewDuration();
        updateAvailableKinds();
        return false;
      };

      var getDefaultKind = function () {
        var defaultFromKinds = Lazy($scope.editingDurations[0].availableKinds).filter(function(d) {
          return d.isDefault == true;
        }).toArray();

        if (defaultFromKinds.length > 0) {
          return Lazy($scope.editingDurations[0].availableKinds).filter(function(d) {
            return d.isDefault == true;
          }).toArray()[0];
        } else {
          return $scope.editingDurations[0].availableKinds[0];
        }
      };  

      var initDurations = function(){
        if($scope.durations && $scope.durations.length > 0){
          $scope.editingDurations = $scope.durations;
        }
      };

      $scope.$watch('durations', function(){
        initDurations();
      });

      initDurations();

      $scope.$watch('editingDurations', function(durations){
        $scope.canAddDuration = $scope.editingDurations.length < $scope.kinds.length;
        $scope.canRemoveDuration = $scope.editingDurations.length > 1;
        $scope.durations = durations;
      });

      $scope.$watch('chart', function(chart){
        refreshKinds(chart);
      });

      // hotkeys initialization
      hotkeys.bindTo($scope)
        .add({
          combo: 'alt+ctrl+p',
          description: 'Increase the minutes value',
          allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
          callback: function () {
            $scope.addMinutes();
          }
        })
        .add({
          combo: 'alt+ctrl+m',
          description: 'Decrease the minutes value',
          allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
          callback: function () {
            $scope.decreaseMinutes();
          }
        })
        .add({
          combo: 'alt+ctrl+shift+p',
          description: 'Increase the hours value',
          allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
          callback: function () {
            $scope.addHour();
          }
        })
        .add({
          combo: 'alt+ctrl+shift+m',
          description: 'Decrease the hours value',
          allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
          callback: function () {
            $scope.decreaseHour();
          }
        });
    }
  };
});
