'use strict';

angular.module('studygroupClientApp')
  .service('StateService', function ($http, $angularCacheFactory, AuthService) {
    var universities = [];
    var selectedUniversity = {};
    var availableCourses = [];
    var selectedCourses = [];

    this.getUniversities = function() {
      return $http.get('http://localhost:8000/' + 'universities/list/', {cache: $angularCacheFactory.get('defaultCache')}).success(function(data) {
        angular.forEach(data, function(value) {
          universities.push(value);
        });
      });
    };

    this.getUniversityList = function() {
      return universities;
    };

    this.getCourses = function() {
      return $http.get('http://localhost:8000/' + 'courses/university/' + selectedUniversity.id, {cache: $angularCacheFactory.get('defaultCache')}).success(function(data) {
        angular.forEach(data, function(value) {
          availableCourses.push(value);
        });
      });
    };

    this.getCourseList = function() {
      return availableCourses;
    };

    this.setUniversity = function(university) {
      selectedUniversity = university;
    };

    this.addCourse = function(courseID, courseName) {
      selectedCourses.push({'id' : courseID, 'name' : courseName, 'active' : true});
    }; 

    this.removeCourse = function(courseID) {
      for(var i = 0; i < selectedCourses.length; i++) {
        if(courseID === selectedCourses[i].id) {
          selectedCourses.splice(i, 1);
        }
      }      
    };       

  });
