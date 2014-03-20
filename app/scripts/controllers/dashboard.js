'use strict';

angular.module('dashboardControllers', [])
  .controller('DashboardCtrl', function ($scope, $http, AuthService) {
    $scope.logout = function() {
      AuthService.logout();
    };

    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      $http.get('http://localhost:8000/' + 'users/profile').success(function(data) {
        console.log(data);
      });
    });
  });