'use strict';

angular.module('studygroupClientApp')
  .directive('sessioncard', function () {
    return {
      templateUrl: 'scripts/directives/sessioncard.html',
      restrict: 'E',
      scope: {
        courseName:'=',
        startTime: '=',
        endTime: '=',
        coordinatorName: '=',
      },
      controller: ['$scope', function($scope) {
        $scope.selectSession = function() {
          console.log('Selected');
        }
      }],
    };
  });
