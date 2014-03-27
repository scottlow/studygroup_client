'use strict';

angular.module('studygroupClientApp')
  .service('StateService', function ($rootScope, $http, $angularCacheFactory, AuthService, $timeout) {
    var universities = [];
    var selectedUniversity = {};
    var availableCourses = [];
    var selectedCourses = [];
    var self = this;

    var currentUser = {};

    this.getUsername = function() {
      return currentUser.username;
    };

    this.getSelectedCourses = function() {
      return currentUser.courses;
    };

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
      // console.log('Getting courses');
      availableCourses = [];        
        angular.forEach(data, function(value) {
          value.disabled = false;          
          availableCourses.push(value);
        });
      });
    };

    this.processLogin = function() {
      $http.get('http://localhost:8000/' + 'users/profile')
      .success(function(data) {
        currentUser = data[0];
        selectedUniversity = currentUser.university;
        self.getCourses();
        $timeout(function() {
          $rootScope.$broadcast('loginProcessed');
        }, 0); // This is hacky and should probably be refactored. Making it higher than this causes notable delay on the UI
      })
      .error(function(error){
        console.log('Error at StateService.processLogin');
      });
    };    

    this.getCourseList = function() {
      return availableCourses;
    };

    this.setUniversity = function(university) {
      selectedUniversity = university;
    };

    this.addCourse = function(courseID, courseName) {
      if(AuthService.isAuthenticated()) {       
        $http.post('http://localhost:8000/' + 'courses/add/', {'course_id' : courseID})
        .success(function(data) {
          console.log('Added course');
        })
        .error(function(error) {
          console.log('Error adding course');
        });
      }
      selectedCourses.push({'id' : courseID, 'name' : courseName, 'active' : true});
    }; 

    this.removeCourse = function(courseID) {
      for(var i = 0; i < selectedCourses.length; i++) {
        if(courseID === selectedCourses[i].id) {
          selectedCourses.splice(i, 1);
        }
      }      
    };  

    this.filterCourse = function(courseID) {
      for(var i = 0; i < selectedCourses.length; i++) {
        if(courseID === selectedCourses[i].id) {
          selectedCourses[i].active = !selectedCourses[i].active;
        }
      }      
    };  

  });
