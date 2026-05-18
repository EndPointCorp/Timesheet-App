'use strict';

angular.module('angularApp').
  directive('reviewingCounter', function(){
    return {
      templateUrl: 'views/_reviewingCounter.html',
      restrict: 'E',
      replace: true,
      scope: {
      },
      controller: function($scope, $location, reviews){
        $scope.reviewNow = function() {
          $location.path('/review');
        }

        reviews.fetchReviewStats().then(function(data){
          $scope.left = data.left;
          $scope.lastFrom = data.last_from;
        });
      }
    }
  });

