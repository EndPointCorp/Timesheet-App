'use strict';

angular.module('angularApp')
.directive('topBar', function(){
  return {
    templateUrl: 'views/_topBar.html',
    restrict: 'E',
    replace: true,
    scope: {},
    controller: function($scope, currentUser, $location, spinner, hotkeys) {
      $scope.location = $location;
      $scope.isLoggedIn = currentUser.user !== null;
      $scope.currentUser = null;

      $scope.redirectToNewEntry = function(){
        var now = new Date(); 
        $location.url("/entries/" + now.getFullYear() + "/" + (now.getMonth() + 1) + "/" + now.getDate() + "/new");
      };

      $scope.redirectToToday = function(){
        $location.url('/today');
      };

      $scope.redirectToCalendar = function(){
        $location.url('/calendar');
      };

      $scope.showNav = function(){
	  	var topbar = document.getElementsByTagName('nav')[0];
		if(topbar.classList.contains('expanded')){
			topbar.classList.remove('expanded');
		}else{
			topbar.classList.add('expanded');
		}
	  };

      $scope.toggleSwitch = function(){
        $location.url("/switch-role");
      };

      $scope.switchTo = function(role){
        currentUser.switchTo(role);
        localStorage['lastEntryCalendarMonth'] = (new Date()).toJSON();
        var ret = $location.path() == '/reports' ? $location.path() : "/"
        $location.url('/login?ret=' + ret); //hack to reload data in UI
      };

      $scope.logout = function(){
        currentUser.logout();
      };

      $scope.$watch(function(){
        return spinner.isSpinner;
      }, function(isSpinner){
        $scope.isSpinner = isSpinner;
      }, true);

      $scope.$watch(function(){
        return currentUser.user;
      }, function(user){
        $scope.currentUser = user;
        $scope.isLoggedIn = user !== null;
      }, true);

      // hotkeys initialization
      hotkeys.bindTo($scope)
        .add({
          combo: 'alt+ctrl+n',
          description: 'Redirect to the new entry form',
          allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
          callback: function () {
            $scope.redirectToNewEntry();
          }
        })
        .add({
          combo: 'alt+shift+ctrl+t',
          description: 'Redirect to the today view',
          allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
          callback: function () {
            $scope.redirectToToday();
          }
        })
        .add({
          combo: 'alt+ctrl+c',
          description: 'Redirect to the calendar view',
          allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
          callback: function () {
            $scope.redirectToCalendar();
          }
        });
    }
  }
});
