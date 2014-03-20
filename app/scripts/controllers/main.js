'use strict';

angular.module('clientControllers', ['ngAnimate'])
  .controller('MainCtrl', function ($scope, $http, $location, AuthService, constants, $angularCacheFactory) {
    $scope.universities = [];
    $scope.showWelcome = true;
    $scope.hasSubmitted = false;
    $scope.dimMap = true;
    $scope.cameFromMap = false;
    $http.get(constants.serverName + 'universities/list/').success(function(data) {
      var count = 0;
      angular.forEach(data.results, function(value) {
        $scope.universities.push(value);
      });
      $scope.university = $scope.universities[0];
    });

    $scope.showSignUp = function() {
      $scope.showWelcome = false;
      $scope.dimMap = true;
    };

    $scope.hideSignup = function() {
      $scope.dimMap = $scope.cameFromMap ? false : true;
    };    

    $scope.login = function() {
      if($scope.loginForm.$valid === true) {
        AuthService.login($scope.login.username, $scope.login.password).then(function(status) {
          if(status !== 200) {
            $scope.loginError = true;
          } else {
            $scope.loginError = false;
            $location.path('/dashboard');
          }
        });
      } else {
        $scope.loginError = true;
      }
    };

    $scope.chooseUniversity = function() {
      var center = new google.maps.LatLng($scope.university.latitude, $scope.university.longitude);
      $scope.gmap.panTo(center);
      $scope.gmap.setZoom(17);
      $scope.dimMap = false;
      $scope.cameFromMap = true;
    };

    $scope.submitRegistration = function() {
      $scope.usernamePostError = false;
      $scope.usernameErrorMessage = '';
      $scope.emailPostError = false;
      $scope.emailErrorMessage = '';
      if ($scope.registerForm.$valid) {
        $http.post(constants.serverName + 'register/', {username: $scope.user.username, password: $scope.user.password, name: $scope.user.name, email: $scope.user.email})
        .success(function (data, status, headers, config) {
          AuthService.login($scope.user.username, $scope.user.password);
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
    return function ($scope, elem, attrs) {
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
      $scope.gmap = map;
    };
  })
  .constant('constants', {
    serverName: 'http://localhost:8000/'
  });