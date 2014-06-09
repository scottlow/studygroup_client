'use strict';

angular.module('dashboardControllers', [])
  .controller('DashboardCtrl', function ($scope, $http, AuthService, StateService, $angularCacheFactory) {

    $scope.showChangePassword = false;
    $scope.newPassword = "";
    $scope.verifyPassword = "";

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
      $scope.user = StateService.getUserObj();      
      $scope.full_name = StateService.getUsername();
      $scope.first_name = $scope.full_name.split(' ')[0];
    });

    $scope.checkPasswords = function() {
      if($scope.newPassword !== $scope.verifyPassword) {
        $scope.updateUserForm.verifyPassword.$error.passwordMatch = true;
        $scope.updateUserForm.newPassword.$invalid = true;          
        $scope.updateUserForm.verifyPassword.$invalid = true;
      } else if($scope.newPassword !== "" && $scope.verifyPassword !== "") {
        $scope.updateUserForm.verifyPassword.$error.passwordMatch = false;
        $scope.updateUserForm.newPassword.$invalid = false;            
        $scope.updateUserForm.verifyPassword.$invalid = false;          
      }
    };

    $scope.submitAccountUpdate = function() {
      if($scope.showChangePassword) {
        $scope.checkPasswords();
      }

      $scope.hasSubmitted = true;      
    };

  });