'use strict';

angular.module('studygroupClientApp')
  .directive('sessioncard', ['AuthService', function (AuthService) {
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
        $scope.AuthService = AuthService;
        console.log($scope.AuthService.isAuthenticated());
      }],
    };
  }]);
