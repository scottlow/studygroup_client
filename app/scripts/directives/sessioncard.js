'use strict';

angular.module('studygroupClientApp')
  .directive('sessioncard', function (StateService, $rootScope) {
    return {
      templateUrl: 'scripts/directives/sessioncard.html',
      restrict: 'E',
      scope: {
        courseName:'=',
        startTime: '=',
        endTime: '=',
        coordinator: '=',
        locationName: '=',
        roomNumber: '=',
        joinText: '=',
        id: '@',
        attendees: '=',
        maxParticipants: '=',
      },
      controller: ['$scope', function($scope) {
        $scope.Math = window.Math;

        $scope.joinOrLeaveSession = function(sessionID) {
          StateService.joinOrLeaveSession(parseInt(sessionID));
        }

        $scope.addSessionToCalendar = function(sessionID) {
          return StateService.addEventToCalendar($scope.courseName, 'This is an event description from http://studypl.us', $scope.locationName+" Room: "+$scope.roomNumber, $scope.startTime, $scope.endTime);
        }

        $scope.viewUserProfile = function(user) {
          user.first_name = user.first_name === '' ? user.username : user.first_name
          $rootScope.$broadcast('showUserProfileModal', user);
        }

      }],
    };
  });
