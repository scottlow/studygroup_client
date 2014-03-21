'use strict';

angular.module('clientServices', ['ivpusic.cookie'])
  .service('AuthService', function ($http, ipCookie, $location, $angularCacheFactory) {
    this.login = function(username, password) {
      var promise = $http.post('http://localhost:8000/' + 'verify_credentials/', {username: username, password: password})
      .then(function(response) {
        // This is a success, so we can set the cookie.
        if(response.data.token) {
          ipCookie('studyToken', response.data.token, {expires: 14});
          $http.defaults.headers.common.Authorization = 'Token ' + response.data.token;          
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
    };

    this.isAuthenticated = function() {
      var authToken = ipCookie('studyToken');
      if(authToken !== undefined) {
        $http.defaults.headers.common.Authorization = 'Token ' + authToken;         
        return true;
      } else {
        return false;
      }
    };

    this.logout = function() {
      ipCookie.remove('studyToken');
      delete $http.defaults.headers.common.Authorization; 
      console.log($angularCacheFactory.get('defaultCache'));
      $angularCacheFactory.get('defaultCache').remove('http://localhost:8000/users/profile');           
      $location.path('/');
    };
  });
