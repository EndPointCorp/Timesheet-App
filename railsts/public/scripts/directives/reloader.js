'use strict';

angular.module('angularApp')
.directive('reloader', function(){
  return {
    templateUrl: 'views/_reloader.html',
    restrict: 'E',
    replace: true,
    scope: {},
    controller: function($scope, $timeout, appVersion){
	$scope.reloadIn = 15;
	$scope.reloadSpottedAt = null;
	$scope.shouldReload = false;

	var _waitToReload = function() {
	  var _wait = function() {
	    if($scope.reloadSpottedIn === null) {
	      return;
	    }

	    var difference = 15 - ((new Date).getTime() - $scope.reloadSpottedAt.getTime()) / 1000;

	    if(difference <= 0) {
	      $scope.reload();
	    }
	    else {
	      $scope.reloadIn = Math.floor(difference);
	      $timeout(_wait, 100);
	    }
	  };
	  $timeout(_wait, 100);
	}

	$scope.$on('appVersion.frontend.changed', function() {
	  $scope.shouldReload = true;
	  $scope.reloadSpottedAt = new Date();
	  _waitToReload();
	});

	$scope.reload = function() {
	  $scope.shouldReload = false;
	  $scope.reloadIn = 15;

	  window.location.reload(true);
	}
    }
  }
});

