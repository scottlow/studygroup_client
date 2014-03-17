'use strict';

angular.module('clientControllers', [])
  .controller('MainCtrl', function ($scope, $http, AuthService, constants) {
    $scope.universities = [];
    $scope.showWelcome = true;
    $scope.hasSubmitted = false;
    $http.get(constants.serverName + 'universities/list/').success(function(data) {
      $scope.universities.push(data.results[0].name);
    });

    $scope.showSignUp = function() {
      $scope.showWelcome = false;
    };

    $scope.login = function() {
      AuthService.login($scope.loginForm.$valid, $scope.login.username, $scope.login.password).then(function(status) {
        if(status !== 200) {
          $scope.loginError = true;
        } else {
          $scope.loginError = false;
        }
      });
    };

    $scope.submitRegistration = function() {
      if ($scope.registerForm.$valid) {
        $http.post(constants.serverName + 'register/', {username: $scope.user.username, password: $scope.user.password, name: $scope.user.name, email: $scope.user.email})
        .success(function (data, status, headers, config) {
          alert('You registered!');
          console.log(data);
        })
        .error(function (data, status, headers, config) {
          var h = headers();
          if(h['error-type'] === 'username') {
            $scope.usernamePostError = true;
            $scope.usernameErrorMessage = h['error-message'];
          } else if(h['error-type'] === 'email') {
            $scope.emailPostError = true;
            $scope.emailErrorMessage = h['error-message'];
          }
        });
      }
      $scope.hasSubmitted = true;
    };
  })
  .directive('homeMap', function () {
    return function (scope, elem, attrs) {
      var mapOptions,
        latitude = attrs.latitude,
        longitude = attrs.longitude,
        zoom = attrs.zoom,
        map;

      latitude = latitude && parseFloat(latitude, 10) || 48.4630959;
      longitude = longitude && parseFloat(longitude, 10) || -123.3121053;
      zoom = zoom && parseInt(zoom) || 10;

      mapOptions = {
        zoomControl: false,
        panControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        zoom: zoom,
        center: new google.maps.LatLng(latitude, longitude)
      };

      map = new google.maps.Map(elem[0], mapOptions);
    };
  })
  .constant('constants', {
    serverName: 'http://localhost:8000/'
  });