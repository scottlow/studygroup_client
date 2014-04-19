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
        locationName: '=',
        roomNumber: '=',
      },
      controller: ['$scope', function($scope) {
        $scope.Math = window.Math;
      }],
    };
  });
