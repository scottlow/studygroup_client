'use strict';

angular.module('studygroupClientApp')
  .controller('MainCtrl', function ($scope, $http) {
    $scope.awesomeThings = [];
    $http.get('http://localhost:8000/users/').success(function(data) {
      console.log(data);
      $scope.awesomeThings.push(data.results[0].username);
    });
  });
