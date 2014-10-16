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
        joinText: '=',
        id: '@',
        attendees: '=',
      },
      controller: ['$scope', function($scope) {
        $scope.Math = window.Math;

        $scope.joinOrLeaveSession = function(sessionID) {
          StateService.joinOrLeaveSession(parseInt(sessionID));
        }

        $scope.addSessionToCalendar = function(sessionID) {
          StateService.addToCalendar(parseInt(sessionID));
          console.log("Generating Calendar Object...");
        }

      }],
    };
  });
