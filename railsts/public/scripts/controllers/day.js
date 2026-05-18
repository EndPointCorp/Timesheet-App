'use strict';

angular.module('angularApp')
  .controller('DayCtrl', function($scope, $routeParams, workEntries, $location, currentUser, gToast, $window, hotkeys) {
    $scope.entries = [];
    $scope.currentUser = currentUser.user;

    var initDate = function(){
      if($routeParams['year']){
        $scope.date = new Date(parseInt($routeParams['year'],  10), 
                               parseInt($routeParams['month'], 10) - 1, 
                               parseInt($routeParams['day'],   10));
      }
      else{
        $scope.date = new Date();
      }
    };

    var setupEntries = function(res){
      var entries = res.data;
      $scope.entries = Lazy(entries).map(function(e){
        var entry = e;
        entry.initChartLabels = Lazy(e.work_chart_label_parts).drop(1).
          reverse().drop(1).reverse().toArray();
        entry.lastChartLabel = Lazy(e.work_chart_label_parts).last();
        entry.total = entry.total_duration / 60;
        entry.onlySelfReviewing = Lazy(entry.owners).map(function(o){ return o.email; }).join(':') == currentUser.user.assumed_email;
        entry.locked = ((entry.is_invoiced || (entry.owners !== null && entry.owners !== undefined && entry.owners.length == 0)));
        entry.isEditable = !entry.is_invoiced && ((entry.owners === null || entry.owners === undefined || (entry.approved_count == 0 && entry.owners.length == 0)) ||
          currentUser.user.is_director ||
          Lazy(entry.owners).find(function(owner){ return owner.email == currentUser.user.assumed_email }) !== undefined)
        return entry;
      }).toArray();
      $scope.isFetchingEntries = false;
    };

    var reportError = function(err){
      gToast.open("There was a problem retrieving the list of entries.<br />Please try again or contact the dev team.");
    };

    var refreshEntries = function(){
      $scope.isFetchingEntries = true;
      // $scope.entries = [];
      workEntries.fetchDayEntriesByDate($scope.date).then(setupEntries, reportError,setupEntries);
    };

    $scope.reclaim = function(entry) {
      workEntries.reclaim(entry).then(refreshEntries);
    };

    $scope.$watch('entries', function(entries){
      $scope.total_billable = Lazy(entries).map(function(e){ return e.total_billable; }).sum() / 60;
      $scope.total_nonbillable = Lazy(entries).map(function(e){ return e.total_nonbillable; }).sum() / 60;
      $scope.total_pto = Lazy(entries).map(function(e){ return e.total_pto; }).sum() / 60;
      $scope.total_overall = Lazy(entries).map(function(e){ return e.total_duration; }).sum() / 60;
      $scope.selectedEntry = Lazy(entries).first();
    });

    $scope.editSelected = function(){
      $scope.editEntry($scope.selectedEntry);
    };

    $scope.deleteSelected = function(){
      $scope.deleteEntry($scope.selectedEntry);
    };

    $scope.selectNext = function(){
      var currentIndex = Lazy($scope.entries).indexOf($scope.selectedEntry);
      if(currentIndex < ($scope.entries.length - 1)){
        $scope.selectedEntry = $scope.entries[currentIndex + 1];
      }
    };

    $scope.selectPrev = function(){
      var currentIndex = Lazy($scope.entries).indexOf($scope.selectedEntry);
      if(currentIndex > 0){
        $scope.selectedEntry = $scope.entries[currentIndex - 1];
      }
    };

    $scope.editEntry = function(entry){
      $location.url("/entries/" + entry.id + "/edit");
    };

    $scope.newEntry = function(){
      $location.url("/entries/" + $scope.date.getFullYear() + "/" + ($scope.date.getMonth() + 1) + "/" + $scope.date.getDate() + "/new");
    };

    $scope.deleteEntry = function(entry){
      var confirmed = $window.confirm('Are you sure?');
      
      if (confirmed === true) {
        workEntries.delete(entry.id).then(function(){
          $scope.entries = Lazy($scope.entries).filter(function(e){
            return e.id != entry.id;
          }).toArray();
          gToast.open("Work entry deleted");
        });
      }
    };

    initDate();

    $scope.$watch('date', function(date){
      $location.url("/entries/" + date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate());
    });

    refreshEntries();

    // hotkeys initialization
    hotkeys.bindTo($scope)
      .add({
        combo: 'up',
        description: 'Select the previous entry',
        allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
        callback: function () {
          $scope.selectPrev();
        }
      })
      .add({
        combo: 'down',
        description: 'Select the next entry',
        allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
        callback: function () {
          $scope.selectNext();
        }
      })
      .add({
        combo: 'alt+ctrl+enter',
        description: 'Edit the selected entry',
        allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
        callback: function () {
          $scope.editSelected();
        }
      })
      .add({
        combo: 'alt+ctrl+d',
        description: 'Delete the selected entry',
        allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
        callback: function () {
          $scope.deleteSelected();
        }
      });
  });
