'use strict';

angular.module('angularApp')
.directive('quickSearch', function(){
  return {
    templateUrl: 'views/_quickSearch.html',
    restrict: 'E',
    replace: true,
    scope: {
      chart: '=chart',
      includeLevel: '@',
      includeNonleafs: '@',
      showHidden: '=?',
      showDead: '=?',
      focus: '=?'
    },
    controller: function($scope, workCharts, hotkeys) {
      $scope.$watch('quick_search_chart', function(c){
        if(c != null && c != undefined && ($scope.chart == null || c.originalObject.id != $scope.chart.id)){
          $scope.chart = workCharts.byId(c.originalObject.id, $scope.includeLevel);
        }
      });

      $scope.searchUrl = "/work_charts/search.json?include_nonleafs=" + ($scope.includeNonleafs == 'true') + "&term=";

      $scope.$watch('includeLevel', function(level){
        if(level == 'hidden'){
          $scope.searchUrl = "/work_charts/search.json?include_nonleafs=" + ($scope.includeNonleafs == 'true') + "&include_hidden=true&term=";
        }
        else if(level == 'dead'){
          $scope.searchUrl = "/work_charts/search.json?include_nonleafs=" + ($scope.includeNonleafs == 'true') + "&include_hidden=true&include_dead=true&term=";
        }
        else{
          $scope.searchUrl = "/work_charts/search.json?include_nonleafs=" + ($scope.includeNonleafs == 'true') + "&term=";
        }
      });

      if($scope.includeLevel === undefined){
        $scope.includeLevel = 'active';
      }

      $scope.$watch('showDead', function(){ 
        if($scope.showDead != undefined) {
          $scope.includeLevel = $scope.showDead? 'dead' : 'active';
        }
      });

      $scope.$watch('showHidden', function(){ 
        if($scope.showHidden != undefined) {
          $scope.includeLevel = $scope.showHidden? 'hidden' : 'active';
        }
      });

      $scope.focusSearch = function(){
        $scope.focus = true;
      };

      // hotkeys initialization
      hotkeys.bindTo($scope).add({
        combo: 'alt+ctrl+w',
        description: 'Focus on the search field',
        allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
        callback: function () {
          $scope.focusSearch();
        }
      });
    },
    link: function($scope, elem, attrs, ctrl){
      $scope.$watch('chart', function(c){
        if(c != null && c != undefined){
          $scope.quick_search_chart = {
            description: "",
            image: "",
            title: Lazy(c.labels).join(" - "),
            originalObject: c
          };
          var labels = Lazy(c.labels);
          if(c.labels[0] == "End Point Corp."){
            labels = labels.drop(1);
          }
          elem.children()[0].children[0].children[0].value = labels.join(" - ");
        }
        else{
          elem.children()[0].children[0].children[0].value = "";
        }
      });
    }
  }
});
