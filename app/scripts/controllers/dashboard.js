'use strict';

angular.module('dashboardControllers', [])
  .controller('DashboardCtrl', function ($scope, $http, AuthService, $angularCacheFactory) {
    $scope.logout = function() {
      AuthService.logout();
    };

    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      $http.get('http://localhost:8000/' + 'users/profile', {cache: $angularCacheFactory.get('defaultCache')}).success(function(data) {
        $scope.full_name = data[0].first_name === "" ? data[0].username : data[0].first_name;
      });
    });
  });