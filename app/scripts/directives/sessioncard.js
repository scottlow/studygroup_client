'use strict';

angular.module('studygroupClientApp')
  .directive('sessioncard', function (StateService) {
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
        id: '=',
        joinText: '=',
      },
      controller: ['$scope', function($scope) {
        $scope.Math = window.Math;

        $scope.joinSession = function(sessionID) {
          StateService.joinSession(sessionID);
        }

      }],
    };
  });
