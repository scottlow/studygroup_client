'use strict';

angular.module('studygroupClientApp')
  .service('StateService', function ($rootScope, $http, $angularCacheFactory, AuthService, $timeout) {
    var universities = [];
    var selectedUniversity = {};
    var availableCourses = [];
    var selectedCourses = [];
    var universityBuildings = [];
    var availableSessions = [];
    var self = this;

    var currentUser = {};

    this.getUsername = function() {
      return currentUser.first_name === '' ? currentUser.username : currentUser.first_name;
    };

    this.getActiveCourseIDs = function() {
      var returnValue = [];

      angular.forEach(currentUser.active_courses, function(value) {
        returnValue.push(value.id);
      });
      return returnValue;
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
      universityBuildings = [];
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
        selectedCourses.length = 0; //If we have other references to this, setting it to a new [] array will lose the references
        if(AuthService.isAuthenticated()) {
          var selectedCourseIds = [];
          var activeCourseIds = [];
          angular.forEach(currentUser.active_courses, function(value) {
            activeCourseIds.push(value.id);
          });
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
            var splitName = value.name.split(' - ');
            value.short_name = splitName[0];
            value.full_name = value.name;
            value.name = splitName[1];
            if(selectedCourseIds.indexOf(value.id) === -1){
              // The course we're looking at is NOT part of this user's course list.
              value.disabled = false;
              availableCourses.push(value);
            } else {
              // The course we're looking at is part of this user's course list.
              value.disabled = true;
              availableCourses.push(value);
              if(activeCourseIds.indexOf(value.id) !== -1) {
                value.active = true;
              } else {
                value.active = false;
              }
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
        $rootScope.$broadcast('changedCourse', selectedCourses);        
      })
      .error(function(data) {
        console.log('Error at StateService.getCourses()');
      });
    };

    this.processLogin = function() {
      self.clearState();
      $http.get('http://localhost:8000/' + 'users/profile')
      .success(function(data) {
        currentUser = data;
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

    this.setAvailableSessions = function(sessions) {
      availableSessions = sessions;
    };

    this.getAvailableSessions = function() {
      return availableSessions;
    };

    this.addCourse = function(course) {
      course.active = true; // Set the course to active since it is for sure being added to the user's list at this point.
      if(AuthService.isAuthenticated()) {
        $http.post('http://localhost:8000/' + 'courses/add/', {'course_id' : course.id})
        .success(function(data) {
          console.log('Added course');
          currentUser.active_courses.push(course);
          $rootScope.$broadcast('changedCourse', selectedCourses);
        })
        .error(function(error) {
          console.log('Error adding course');
          self.removeCourseData(course.id);
        });
      }
      // This will push to the UI prematurely (i.e. before the post request has gone through. The call to self.removeCourseData above will fix this if it errors out)
      course.loading = true; // For animations!
      selectedCourses.push(course);     
    };

    this.removeCourse = function(course) {
      if(AuthService.isAuthenticated()) {
        return $http.post('http://localhost:8000/' + 'courses/remove/', {'course_id' : course.id})
        .success(function(data) {
          console.log('Removed course');
          var courseIndex = self.getActiveCourseIDs().indexOf(course.id); 
          currentUser.active_courses.splice(courseIndex, 1);
          $rootScope.$broadcast('changedCourse', selectedCourses);          
        })
        .error(function(error) {
          console.log('Error adding course');
          self.selectedCourses.push(course); // Re-add the course on the UI side in the case of an error since the data model hasn't been updated.
        });
      }
    };

    this.removeCourseData = function(courseID) {
      for(var i = 0; i < selectedCourses.length; i++) {
        if(courseID === selectedCourses[i].id) {
          selectedCourses.splice(i, 1);
        }
      }
    };

    this.filterCourse = function(course) {
      if(AuthService.isAuthenticated()) {
        return $http.post('http://localhost:8000/' + 'courses/filter/', {'course_id' : course.id})
        .success(function(data) {
          
          var courseIndex = self.getActiveCourseIDs().indexOf(course.id);
          console.log(courseIndex);
          if(courseIndex === -1) {
            currentUser.active_courses.push(course);
          } else {          
            currentUser.active_courses.splice(courseIndex, 1);
          }

          $rootScope.$broadcast('filteredCourse');
        })
        .error(function(error) {
          console.log('Error filtering course');
          course.active = !course.active; // Flip the UI back to whatever its value was previously
        });        
      }
    };

    this.createSession = function(courseID, startTime, endTime, location, roomNumber) {
      if(AuthService.isAuthenticated()) {
        return $http.post('http://localhost:8000/' + 'sessions/create/', {
                'coordinator' : currentUser.id,
                'course' : courseID,
                'start_time' : startTime,
                'end_time' : endTime,
                'location' : location.id,
                'room_number' : roomNumber
        });
      }
    };

    this.clearState = function() {
      selectedUniversity = {};
      availableCourses = []; 
      universityBuildings = [];           
      selectedCourses = [];
      availableSessions = [];
    };

    this.logout = function()  {
      self.clearState();
    };

  });
