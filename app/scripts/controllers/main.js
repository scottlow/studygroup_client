'use strict';

angular.module('clientControllers', ['ngAnimate'])
  .controller('MainCtrl', function ($rootScope, $scope, $http, $location, AuthService, StateService, constants, $angularCacheFactory) {
    $scope.universities = []; // The drop down of universities to be displayed on the main page
    $scope.showWelcome = true; // True if we're showing the welcome (Study better.) pane now? Or the sign up pane?
    $scope.hasSubmitted = false; // True if the user has submitted the sign up form at least once.
    $scope.dimMap = true; // True if the map is blurred and obscured by a dimmed background
    $scope.cameFromMap = false; // True if the user was last viewing an undimmed map. (Boolean flag for UI purposes)
    $scope.displayUI = false;
    $scope.lat = '48.4428524';
    $scope.long  ='-123.3592758';
    $scope.zoom = 13;

    // Populate the universities drop down list
    StateService.getUniversities().then(function() {
      $scope.universities = StateService.getUniversityList();
      $scope.university = $scope.universities[0];      
    });

    // Show the sign up pane
    $scope.showSignUp = function() {
      $scope.showWelcome = false;
      $scope.dimMap = true;
      // $scope.displayUI = false;
    };

    // Hide the sign up pane
    $scope.hideSignup = function() {
      if($scope.cameFromMap) {
        $scope.dimMap = false;
        // $scope.displayUI = true;
      } else {
        $scope.dimMap = true;
        // $scope.displayUI = false;
        $scope.showWelcome = true;
      }
    };

    // Attempt a login
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

    // When the user selects a university, move and zoom the map and undim it accordingly.
    $scope.chooseUniversity = function() {
      StateService.setUniversity($scope.university);
      $scope.$broadcast('universitySelected');
      $scope.lat = $scope.university.latitude;
      $scope.long = $scope.university.longitude;
      $scope.zoom = 17;
      $scope.dimMap = false;
      $scope.cameFromMap = true;
      $scope.displayUI = true;
    };

    // Submit the registration form and perform validation on it.
    $scope.submitRegistration = function() {
      $scope.usernamePostError = false;
      $scope.usernameErrorMessage = '';
      $scope.emailPostError = false;
      $scope.emailErrorMessage = '';
      // Attempt to submit registration information to the userver
      if ($scope.registerForm.$valid) {
        $http.post(constants.serverName + 'register/', {username: $scope.user.username, password: $scope.user.password, name: $scope.user.name, email: $scope.user.email, university: $scope.university.id, courses: StateService.getSelectedCourses(), active_courses: StateService.getActiveCourseIDs()})
        .success(function (status) {
          // Once registered, we should be able to log in
          AuthService.login($scope.user.username, $scope.user.password).then(function(status) {
            if(status !== 200) {
              // We should never get here
              $scope.loginError = true;
            } else {
              $scope.loginError = false;
              $location.path('/dashboard');
            }
          });
        })
        .error(function (data, status, headers, config) {
          // If there's been an error, time to display it back to the user on the form. (These are where server side errors are set)
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
  .constant('constants', {
    // Some constants in an attempt to reduce hardcoding. Turns out constants aren't global, so this doesn't do much. 
    serverName: 'http://localhost:8000/'
  });