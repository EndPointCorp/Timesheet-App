'use strict';

angular.module('angularApp')
  .controller('ProjectsCtrl', function ($scope, $location, projects) {
    $scope.period = '1 year';

    var fetchProjects = function(period){
      projects.fetchActiveProjects(period).then(function(_projects){
        $scope.projects = _projects;
      });
    }; 

    $scope.projectLabels = function(project){
      return project.project_labels.slice(1);
    };

    $scope.openReport = function(project){
      var date = _.first(_.sortBy(project.entries, 'date_performed')).date_performed;
      var endDate = new Date().toJSON().slice(0,10);
      $location.url("reports?type=standard&start=" + date + "&end=" + endDate + "&root=" + project.project_id + "&roles=all&description=true&show=false&fragmentation=continuous")
    };

    var budgetFor = function(project, type){
      var budget = _.find(project.budgets, function(b){
        return b.mode === type;
      });
      return (budget === undefined || budget.minutes_left === null) ? null : budget.minutes_left / 60;
    };

    $scope.durationFor = function(duration){
      return (duration / 60).toFixed(2);
    };

    $scope.modeFor = function(project, type, postfix){
      var left = budgetFor(project, type);
      postfix = postfix === undefined ? "" : postfix;
      if(left == null){
        return "hours-null" + postfix;
      }
      else if(left > 16){
        return "hours-good" + postfix;
      }
      else if(left > 0) {
        return "hours-close" + postfix;
      }
      else {
        return "hours-none" + postfix;
      }
    };

    $scope.billableBudgetLeft = function(project){
      var value = budgetFor(project, "billable");
      if(value !== undefined && value !== null){
        return value.toFixed(2);
      }
      else {
        return "no active budget";
      }
    };

    $scope.nonbillableBudgetLeft = function(project){
      var value = budgetFor(project, "nonbillable");
      if(value !== undefined && value !== null){
        return value.toFixed(2);
      }
      else {
        return "no active budget";
      }
    };

    $scope.fetchEntries = function(project) {
      projects.fetchEntriesFor(project.project_id).then(function(entries) {
        project.entries = entries;
      });
    };

    $scope.toggleProject = function(project) {
      if(project.showsDetails == true) {
        project.showsDetails = false;
	return;
      }

      project.showsDetails = true;

      if(project.entries === undefined) {
        $scope.fetchEntries(project);
      }
    };

    $scope.$watch('period', function(period){
      fetchProjects(period);
    });
  });

