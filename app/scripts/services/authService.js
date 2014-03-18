'use strict';

angular.module('clientServices', ['ivpusic.cookie'])
  .service('AuthService',  ['$http', 'ipCookie', function ($http, ipCookie) {
    this.login = function(isValid, username, password) {
      console.log(ipCookie());
      if (isValid === true) {
        var promise = $http.post('http://localhost:8000/' + 'verify_credentials/', {username: username, password: password})
        .then(function(response) {
          // This is a success, so we can set the cookie.
          if(response.data.token) {
            ipCookie('studyToken', response.data.token, {expires: 14});
          } else {
            console.log('Invalid token format.');
            response.status = 400;
          }
          return response.status;
        },
        function(error) {
          return error.status;
        });
        return promise;
      }
    };

    this.isAuthenticated = function() {
      if(ipCookie('studyToken') !== undefined) {
        return true;
      } else {
        return false;
      }
    };
  }]);
