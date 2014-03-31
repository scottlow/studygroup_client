'use strict';

angular.module('dashboardControllers', [])
  .controller('DashboardCtrl', function ($scope, $http, AuthService, StateService, $angularCacheFactory) {
    // Log the user out
    $scope.logout = function() {
      AuthService.logout();
    };

    // If the user has come from somewhere to here, get their username from the server and cache the result for use later.
    $scope.$on('$stateChangeSuccess', function(){
      StateService.processLogin();      
    });

    $scope.$on('loginProcessed', function(){
      $scope.full_name = StateService.getUsername();
      $scope.first_name = $scope.full_name.split(' ')[0];
    });
  });