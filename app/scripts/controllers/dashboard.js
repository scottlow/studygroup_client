'use strict';

angular.module('dashboardControllers', [])
  .controller('DashboardCtrl', function ($scope, $http, AuthService, $angularCacheFactory) {
    // Log the user out
    $scope.logout = function() {
      AuthService.logout();
    };

    // If the user has come from somewhere to here, get their username from the server and cache the result for use later.
    $scope.$on('$stateChangeSuccess', function(){
      $http.get('http://localhost:8000/' + 'users/profile', {cache: $angularCacheFactory.get('defaultCache')}).success(function(data) {
        $scope.full_name = data[0].first_name === '' ? data[0].username : data[0].first_name;
      });
    });
  });