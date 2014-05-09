'use strict';

angular.module('dashboardControllers', [])
  .controller('DashboardCtrl', function ($scope, $http, AuthService, StateService, $angularCacheFactory) {
    // Log the user out
    $scope.logout = function() {
      StateService.logout();
      AuthService.logout();
    };

    // If the user has come from somewhere to here, get their username from the server and cache the result for use later.
    $scope.$on('$stateChangeSuccess', function(){
      StateService.processLogin();      
    });

    // This is $broadcasted by StateService when a user has successfully logged in.
    // Here we grab the user's first name (or username if they didn't enter a name) for displaying in the top bar.
    $scope.$on('loginProcessed', function(){
      $scope.full_name = StateService.getUsername();
      $scope.first_name = $scope.full_name.split(' ')[0];
    });
  });