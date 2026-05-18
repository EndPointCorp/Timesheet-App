'use strict';

angular.module('angularApp')
.directive('chartsMultiSelect', function(){
  return {
    templateUrl: 'views/_chartsMultiSelect.html',
    restrict: 'E',
    replace: true,
    scope: {
      chart: '=chart',
      allowSelect: '@',
      includeLevel: '@',
      isIncludeTop: '@',
      showHidden: '=',
      showDead: '='
    },
    controller: function($scope, workCharts){
      $scope.chartLevels = [];
      $scope.lastSelectedChart = null;
      $scope.selectedWorkChart = $scope.chart || undefined;
      
      if($scope.allowSelect === undefined){
        $scope.allowSelect = 'leafs';
      }

      if($scope.isIncludeTop){
        $scope.rootId = 1;
      } else {
        $scope.rootId = 2;
      }

      var parentFor = function(chart){
        return workCharts.byId(chart.parentId, $scope.includeLevel);
      };

      var levelFor = function(chart){
        var charts = workCharts.atSameLevelForStatus(chart, $scope.includeLevel).toArray();
        return {
          parentId: chart.parentId,
          charts: charts,
          selected: Lazy(charts).find(function(c){ return c.id == chart.id; }) || 'null'
        }
      };

      var levelsFor = function(chart) {
        if(chart !== undefined && (chart.id != 2 || $scope.isIncludeTop)){
          return [levelFor(chart)].concat(levelsFor(parentFor(chart)));
        }
        return [];
      };

      var rebuildLevels = function(chart, forceReload){
        if(chart != null && chart != undefined){
          var toReload = Lazy($scope.chartLevels).find(function(l){
            return l.selected !== undefined && l.selected.id === chart.id;
          }) !== undefined || (chart.id == 2 || $scope.isIncludeTop);
          $scope.chartLevels = Lazy(levelsFor(chart)).flatten().reverse().toArray();
          if(toReload || forceReload == true){
            $scope.valueChanged(Lazy($scope.chartLevels).last());
          }
        }
        else{
          $scope.chartLevels = [
            {
              parentId: $scope.rootId,
              charts: workCharts.rootChildrenByStatus($scope.includeLevel, $scope.rootId).toArray(),
              selected: 'null'
            }
          ];
        }
      };

      $scope.valueChanged = function(level){
        var lastSelected = Lazy(level.charts).find(function(c){
          return level.selected != null && c.id == level.selected.id;
        }); 
        if(lastSelected == null || lastSelected == undefined){
          var found = false;
          $scope.chartLevels = Lazy($scope.chartLevels).takeWhile(function(l){
            var shouldStop = found == false;
            found = l.charts == level.charts;
            return shouldStop;
          }).toArray();
          if($scope.allowSelect == 'all'){
            $scope.selectedWorkChart = Lazy($scope.chartLevels).reverse().filter(function(l){
              return l.selected !== undefined && l.selected !== null;
            }).map(function(l){
              return l.selected;
            }).first();
          }
        }
        else{
          var children = workCharts.childrenForId(lastSelected.id, $scope.includeLevel).toArray();
          if($scope.chartLevels.length > 1){
            var found = false;
            $scope.chartLevels = Lazy($scope.chartLevels).takeWhile(function(l){
              var shouldStop = found == false;
              found = l.parentId == level.parentId;
              return shouldStop;
            }).toArray();
          }
          if(children.length > 0){
            $scope.chartLevels = $scope.chartLevels.concat([{
              parentId: lastSelected.id,
              charts: children,
              selected: 'null'
            }]);
          }
          if(children.length == 0 || $scope.allowSelect == 'all'){
            $scope.selectedWorkChart = lastSelected;
          }
          else {
            $scope.selectedWorkChart = null;
          }
        }
      };

      $scope.clearLevel = function(level){
        level.selected = undefined;
        $scope.valueChanged(level);
      };

      $scope.$watch('selectedWorkChart', function(c){
        if(c == undefined && $scope.allowSelect == 'leaf') return;
        $scope.chart = c;
      }, true);

      $scope.$watch('chart', function(chart){
        if(chart == null || chart == undefined) return;
        $scope.selectedWorkChart = chart;
        rebuildLevels(chart, true);
      });

      $scope.$watch('showDead', function(){ 
        if($scope.showDead != undefined) {
          $scope.includeLevel = $scope.showDead? 'dead' : 'active';
          rebuildLevels($scope.chart);
        }
      });

      $scope.$watch('showHidden', function(){ 
        if($scope.showHidden != undefined) {
          $scope.includeLevel = $scope.showHidden? 'hidden' : 'active';
          rebuildLevels($scope.chart);
        }
      });

      // when the charts tree changes - rebuild levels
      $scope.$watch(function(){
        return workCharts.version;
      },function(){
        rebuildLevels($scope.chart);
      });
      $scope.$watch(function(){
        return workCharts.localVersion;
      },function(){
        rebuildLevels($scope.chart);
      });
      rebuildLevels();
    }
  }
});
