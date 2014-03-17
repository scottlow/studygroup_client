'use strict';

angular.module('clientServices', [])
  .service('AuthService', function ($http) {
    this.login = function(isValid, username, password) {
      if (isValid === true) {
        var promise = $http.post('http://localhost:8000/' + 'verify_credentials/', {username: username, password: password})
        .then(function(response) {
          return response.status;
        },
        function(error) {
          return error.status;
        });
        return promise;
      }
    };
  });
