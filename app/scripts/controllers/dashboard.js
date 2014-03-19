'use strict';

angular.module('dashboardControllers', [])
  .controller('DashboardCtrl', function ($scope, AuthService) {
    $scope.logout = function() {
      AuthService.logout();
    };
  });
