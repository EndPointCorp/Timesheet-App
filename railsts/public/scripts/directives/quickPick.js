'use strict';

angular.module('angularApp')
.directive('quickPick', function(appVersion){
  return {
    templateUrl: 'views/_quickPick.html?v=' + appVersion.frontend,
    restrict: 'E',
    replace: true,
    scope: {
      chart: "=chart"
    },
    controller: function($scope, workCharts){
      $scope.clients = workCharts.quickClients.toArray();
      $scope.others  = workCharts.quickOthers.toArray();
      $scope.selectedChart = $scope.chart || null;
      $scope.showQuickPick = false;
      $scope.dropShown = false;

      $scope.$watch(function(){
        return workCharts.rawQuicks;
      }, function(){
        $scope.clients = workCharts.quickClients.toArray();
        $scope.others  = workCharts.quickOthers.toArray();
      });

      $scope.choose = function(chart){
        $scope.dropShown = false;
        $scope.showQuickPick = false;
        $scope.selectedChart = chart;
      };

      $scope.openOrCloseMenu = function () {
        if(!$scope.showQuickPick) {
          $scope.dropShown = false;
          $scope.showQuickPick = false;
        } else {
          if($scope.dropShown) {
            $scope.dropShown = false;
            $scope.showQuickPick = false;
          } else {
            $scope.dropShown = true;
          }
        }
      };

      $scope.$watch('selectedChart', function(){
        $scope.chart = $scope.selectedChart;
      });

      workCharts.refreshQuicks();
    }
  }
});
