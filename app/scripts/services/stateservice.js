'use strict';

angular.module('studygroupClientApp')
  .service('StateService', function ($http, $angularCacheFactory) {
    var universities = [];

    this.getUniversities = function() {
      return $http.get('http://localhost:8000/' + 'universities/list/', {cache: $angularCacheFactory.get('defaultCache')}).success(function(data) {
        angular.forEach(data, function(value) {
          universities.push(value);         
        });
      });
    };

    this.getUniversityList = function() {
      return universities;
    }
  });
