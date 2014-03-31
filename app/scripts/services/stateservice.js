'use strict';

angular.module('studygroupClientApp')
  .service('StateService', function ($rootScope, $http, $angularCacheFactory, AuthService, $timeout) {
    var universities = [];
    var selectedUniversity = {};
    var availableCourses = [];
    var selectedCourses = [];
    var universityBuildings = [];
    var self = this;

    var currentUser = {};

    this.getUsername = function() {
      return currentUser.first_name === '' ? currentUser.username : currentUser.first_name;
    };

    this.getSelectedCourses = function() {
      return selectedCourses;
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

    this.getUniversityBuildings = function() {
      return $http.get('http://localhost:8000/' + 'locations/university/' + selectedUniversity.id, {cache: $angularCacheFactory.get('defaultCache')}).success(function(data) {
        angular.forEach(data, function(value) {
          universityBuildings.push(value);
        });
      });
    };   

    this.getBuildingList = function() {
      return universityBuildings;
    };

    this.getCourses = function() {
      return $http.get('http://localhost:8000/' + 'courses/university/' + selectedUniversity.id, {cache: $angularCacheFactory.get('defaultCache')})
      .success(function(data) {
        // console.log('Getting courses');
        availableCourses = []; 
        selectedCourses = [];
        if(AuthService.isAuthenticated()) {
          var selectedCourseIds = [];
          angular.forEach(currentUser.courses, function(value) {
            selectedCourseIds.push(value.id);
          });
          /* This is a really nasty block of code, but it's the best way I could think of to do it.
           * essentially what's happening here is at this point, if we're logged in, we KNOW that
           * we have the user data. We've created a list of the course ids that the user has 
           * selected from the database and now we perform the following algorithm. 
           * 
           * For each course that should be in the course search drop down, check to see if it's been
           * selected by the user, if not, don't disable it and add it to the dropdown menu. (It's worth
           * noting here that pushing to availableCourses actually pushes to MainScreen.courseList due
           * to the singleton nature of services in angular. It's confusing, I know.)
           *
           * Otherwise, if the course has been selected by the user, disable it, and push it to selectedCourses
           * to add the course to both the data model and MainScreen.selectedCourses (again due to the singleton
           * nature of services in Angular).
           * 
           * By doing this, we're essentially GUARANTEEING that the UI and the data model will be consistent with one
           * another.
           */
          angular.forEach(data, function(value) {
            var splitName = value.name.split(" - ");
            value.short_name = splitName[0];
            value.full_name = value.name;            
            value.name = splitName[1];
            if(selectedCourseIds.indexOf(value.id) === -1){
              value.disabled = false;
              availableCourses.push(value);
            } else {
              value.disabled = true;
              availableCourses.push(value);
              selectedCourses.push(value);
            }          
          });
        } else {
          angular.forEach(data, function(value) {
            var splitName = value.name.split(" - ");
            value.short_name = splitName[0];
            value.name = splitName[1];            
            value.disabled = false;         
            availableCourses.push(value);
          });
        }
      })
      .error(function(data) {
        console.log('Error at StateService.getCourses()');
      });
    };

    this.processLogin = function() {
      $http.get('http://localhost:8000/' + 'users/profile')
      .success(function(data) {
        currentUser = data[0];
        self.setUniversity(currentUser.university);
        self.getCourses().then(function() {
          //This gurantees that both the user and the list of available courses have been grabbed (and the latter filtered) before the loginProcessed event is broadcast.
          $rootScope.$broadcast('loginProcessed');         
        });
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

    this.getUniversity = function() {
      return selectedUniversity;
    };    

    this.addCourse = function(course) {
      if(AuthService.isAuthenticated()) {       
        $http.post('http://localhost:8000/' + 'courses/add/', {'course_id' : course.id})
        .success(function(data) {
          console.log('Added course');
        })
        .error(function(error) {
          console.log('Error adding course');
          self.removeCourseData(course.id);
        });
      }
      // This will push to the UI prematurely (i.e. before the post request has gone through. The call to self.removeCourseData above will fix this if it errors out)
      selectedCourses.push(course);
    }; 

    this.removeCourse = function(course) {
      if(AuthService.isAuthenticated()) {       
        $http.post('http://localhost:8000/' + 'courses/remove/', {'course_id' : course.id})
        .success(function(data) {
          console.log('Removed course');
        })
        .error(function(error) {
          console.log('Error adding course');
          self.addCourse(course);
        });
      }
      self.removeCourseData(course.id);      
    };

    this.removeCourseData = function(courseID) {
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
