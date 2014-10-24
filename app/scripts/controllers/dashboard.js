'use strict';

angular.module('dashboardControllers', [])
  .controller('DashboardCtrl', function ($scope, $http, AuthService, StateService, $angularCacheFactory, $q) {

    $scope.showChangePassword = false;
    $scope.newPassword = "";
    $scope.verifyPassword = "";

    // Log the user out
    $scope.contactHuman = function() {
      console.log("human help requested.");
    };

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
      var copiedUser = StateService.getUserObj();
      $scope.staticUsername = copiedUser.username;
      $scope.newFirstName = copiedUser.first_name;
      $scope.newEmail = copiedUser.email;

      $scope.full_name = copiedUser.first_name;
      $scope.first_name = $scope.full_name == '' ? copiedUser.username : $scope.full_name.split(' ')[0];
    });

    $scope.checkPasswords = function() {
      // Set up the deferred promise
      var deferred = $q.defer();

      // Check to see if the user has requested a password change
      if($scope.showChangePassword) {
        // If entered passwords don't match, we can error out early.
        if($scope.newPassword !== $scope.verifyPassword) {
          $scope.updateUserForm.verifyPassword.$error.passwordMatch = true;
          $scope.updateUserForm.newPassword.$invalid = true;
          $scope.updateUserForm.verifyPassword.$invalid = true;
          $scope.updateUserForm.password.$invalid = false;
          deferred.resolve(null); // We don't know whether or not we have to make a REST API call due to invalid data. Thus, we can return null (which will terminate execution of submitAccountUpdate())
        } else if($scope.newPassword !== "" && $scope.verifyPassword !== "") {
          // If passwords aren't blank, then we can check to see if we're allowed to change password
          AuthService.checkPassword($scope.staticUsername, $scope.userPassword)
          .success(function(){
            // If so, set the appropriate form validation state and continue processing
            $scope.updateUserForm.verifyPassword.$error.passwordMatch = false;
            $scope.updateUserForm.newPassword.$invalid = false;
            $scope.updateUserForm.verifyPassword.$invalid = false;
            deferred.resolve(true); // We do need to make a request to the REST API in this case, so we can return true
          })
          .error(function() {
            // Otherwise, set the appropriate form validation state and error out
            $scope.updateUserForm.password.$error.passwordIncorrect = true;
            $scope.updateUserForm.password.$invalid = true;
            $scope.updateUserForm.verifyPassword.$error.passwordMatch = false;
            $scope.updateUserForm.newPassword.$invalid = false;
            $scope.updateUserForm.verifyPassword.$invalid = false;
            deferred.resolve(null); // We don't know whether or not we have to make a REST API call due to invalid data. Thus, we can return null (which will terminate execution of submitAccountUpdate())
          });
        }
      } else {
        deferred.resolve(false); // We know for certain that we won't have to make a REST API call yet. Thus we can return false.
      }
      return deferred.promise;
    }

    $scope.submitAccountUpdate = function() {
      var params = {}; // Parameters to send to the REST API (only parameters specified will be updated)
      var makeRequest = false; // True if we should be making a request to the REST API

      // Reset all error messages
      $scope.usernamePostError = false;
      $scope.usernameErrorMessage = '';
      $scope.emailPostError = false;
      $scope.emailErrorMessage = '';

      // Reset all error flags
      $scope.updateUserForm.verifyPassword.$error.passwordMatch = false;
      $scope.updateUserForm.password.$error.passwordIncorrect = false;

      // If we're here, it means the Save Changes button has been clicked and the form has been submitted
      $scope.hasSubmitted = true;

      if($scope.updateUserForm.$valid) {

        // Check passwords This is nasty due to the fact that it's async in CERTAIN cases only. (See comments above)
        $scope.checkPasswords()
        .then(function(result) {

          if(result === true) {
            // This means that the checkPassword call came back OK and we need to make a password change request to the REST API
            makeRequest = result;
            params.password = $scope.newPassword;
          } else if(result === null) {
            // As mentioned above, a null value coming out of checkPasswords() means that we have invalid password data. Hence we can terminate early from submitAccountUpdate()
            return;
          }

          // Otherwise...

          // Check for new name
          if($scope.newFirstName !== StateService.getUserObj().first_name) {
            params.name = $scope.newFirstName;
            $scope.first_name = $scope.newFirstName.split(' ')[0]
            StateService.getUserObj().first_name = $scope.newFirstName; // Set the new name in StateService
            makeRequest = true;
          }

          // Check for new email
          if($scope.newEmail !== StateService.getUserObj().email) {
            params.email = $scope.newEmail;
            makeRequest = true;
          }

          // Make the profile change request if necessary
          if(makeRequest) {
            $http.post('http://localhost:8000/' + 'users/update_profile/', params)
            .success(function (status) {
              console.log("Changed user information");
              StateService.getUserObj().email = $scope.newEmail; // Update email as long as it is unique in the DB (If it's not, the call to /users/update_profile will error out)
              angular.element('#editProfileModal').modal('hide');

              // Reset the modal UI so that anyone who clicks on the Edit Profile button again will be shown a fresh slate.
              $scope.hasSubmitted = false;
              $scope.showChangePassword = false;
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
          } else {
            // If we get here, it means there was no need to make a request. I'm unsure of what the best behaviour is, but for now, I'm going to say we should
            // maintain modal state and close the modal.
            angular.element('#editProfileModal').modal('hide');
          }
        });
      }
    };

  });
