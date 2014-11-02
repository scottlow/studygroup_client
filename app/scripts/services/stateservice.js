'use strict';

angular.module('studygroupClientApp')
  .service('StateService', function ($rootScope, $q, $http, $angularCacheFactory, AuthService, $timeout) {
    var universities = [];
    var selectedUniversity = {};
    var availableCourses = [];
    var selectedCourses = [];
    var universityBuildings = [];
    var availableSessions = [];
    var self = this;

    var showAllFilter = function() {
      return true;
    }

    var showHostedFilter = function(session) {
      if(session.coordinator != undefined && session.coordinator.id === currentUser.id) {
        return true;
      } else {
        return false;
      }
    }

    var showAttendingFilter = function(session) {
      for(var i = 0; i < session.attendees.length; i++) {
        if(session.attendees[i].id === currentUser.id) {
          return true;
          break;
        }
      }
      return false;
    }

    var filterFunction = showAllFilter;

    var currentUser = {};
    currentUser.active_courses = [];

    this.getUserObj = function() {
      return currentUser;
    }

    this.getUsername = function() {
      return currentUser.first_name === '' ? currentUser.username : currentUser.first_name;
    };

    this.getUserID = function() {
      return currentUser.id;
    }

    this.isFiltered = function(session) {
      return !filterFunction(session);
    }

    $rootScope.$on('displayHostingSessions', function() {
      filterFunction = showHostedFilter;
      $timeout(function() {
        $rootScope.$broadcast('refreshPins');
      });
    });

    $rootScope.$on('displayAttendingSessions', function() {
      filterFunction = showAttendingFilter;
      $timeout(function() {
        $rootScope.$broadcast('refreshPins');
      });
    });

    $rootScope.$on('displayAllSessions', function() {
      filterFunction = showAllFilter;
      $timeout(function() {
        $rootScope.$broadcast('refreshPins');
      });
    });

    // Parse session to Calendar object
    this.addToCalendar = function(sessionID) {
      //return a iCal object
    }

    this.joinOrLeaveSession = function(sessionID) {
      console.log(sessionID);
      if(AuthService.isAuthenticated()) {
        for(var i = 0; i < availableSessions.length; i++) {
          if(sessionID === availableSessions[i].id) {
            if(availableSessions[i].joinText === 'Join') {
              availableSessions[i].marker.setIcon({scaledSize: new google.maps.Size(22, 40), url:"../img/spotlight-poi-yellow.png"});
              availableSessions[i].joinText = 'Leave';
              // Insert at index 0
              availableSessions[i].attendees.unshift(currentUser);

              $http.post('http://localhost:8000/' + 'sessions/join', {'session_id' : sessionID})
              .success(function(data) {
                console.log("Joined session with ID " + sessionID);
              })
              .error(function(error) {
                console.log("Could not join session with ID " + sessionID);
                availableSessions[i].attendees.splice(0, 1);
              });
            } else {
              availableSessions[i].joinText = 'Join';
              availableSessions[i].marker.setIcon({scaledSize: new google.maps.Size(22, 40), url:"../img/spotlight-poi-green.png"});

              // If you are the coordinator and there are other attendees, remove coordinator from session
              // If there are no other attendees, delete the session.
              // If you are NOT the coordinator, leave the session if there are other attendees, and if there
              // are not, then delete the session.
              if (availableSessions[i].coordinator && availableSessions[i].coordinator.id == currentUser.id) {
                if (availableSessions[i].attendees.length == 0) {
                  availableSessions.splice(i, 1);
                  if(availableSessions.length === 0) {
                    $rootScope.$broadcast('noSessions', true);
                  }
                  $rootScope.$broadcast('refreshPins');
                } else {
                  // Is there a better way to do this.?
                  availableSessions[i].coordinator = null;
                }
              } else {
                // If you are the only attendee, and there are no coordinators, then delete the session.

                var removedSession = undefined;

                if (!availableSessions[i].coordinator && availableSessions[i].attendees.length == 1) {
                  removedSession = availableSessions.splice(i, 1);
                  if(availableSessions.length === 0) {
                    $rootScope.$broadcast('noSessions', true);
                  }
                  $rootScope.$broadcast('refreshPins');
                } else {
                  var userIndex = 0;
                  for (var j = 0; j < availableSessions[i].attendees.length; j++) {
                    if (availableSessions[i].attendees[j].username == currentUser.username) {
                      // Index needed later to reinsert into the list of attendees in case HTTP POST returns an error
                      userIndex = j;
                      availableSessions[i].attendees.splice(userIndex, 1);
                      break;
                    }
                  }
                }
              }

              if(sessionID === -1) {
                return;
              }

              $http.post('http://localhost:8000/' + 'sessions/leave', {'session_id' : sessionID})
              .success(function(data) {
                console.log("Left a session with ID " + sessionID);
              })
              .error(function(error) {
                console.log("Could not leave session with ID " + sessionID);

                if (removedSession != undefined) {
                  availableSessions.splice(i, 0, removedSession);
                } else {
                  availableSessions[i].attendees.splice(userIndex, 0, currentUser);
                }
              });
            }

            break;
          }
        }
        $rootScope.$broadcast('refreshBubbles');
      } else {
        $rootScope.$broadcast('showRegisterPrompt', true);
      }
    }

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
        if(selectedCourses.length !== 0) {
          $timeout(function() {
            $rootScope.$broadcast('changedCourse', selectedCourses);
          });
        } else {
          $rootScope.$broadcast('noSessions', true);
        }
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

        // This will push to the UI prematurely (i.e. before the post request has gone through. The call to self.removeCourseData above will fix this if it errors out)
        course.loading = true; // For animations!
        selectedCourses.push(course);
      } else {
        course.loading = true; // For animations!
        currentUser.active_courses.push(course);
        selectedCourses.push(course);
        $rootScope.$broadcast('changedCourse', selectedCourses);
      }
    };

    this.removeCourse = function(course) {
      if(AuthService.isAuthenticated()) {

        var courseIndex = self.getActiveCourseIDs().indexOf(course.id);
        currentUser.active_courses.splice(courseIndex, 1);
        $rootScope.$broadcast('changedCourse', selectedCourses, course.id);

        $http.post('http://localhost:8000/' + 'courses/remove/', {'course_id' : course.id})
        .success(function(data) {
          console.log('Removed course');
        })
        .error(function(error) {
          console.log('Error adding course');
          self.selectedCourses.push(course); // Re-add the course on the UI side in the case of an error since the data model hasn't been updated.
        });
      } else {
        var deferred = $q.defer();
        var courseIndex = self.getActiveCourseIDs().indexOf(course.id);
        currentUser.active_courses.splice(courseIndex, 1);
        $rootScope.$broadcast('changedCourse', selectedCourses, course.id);
        deferred.resolve();
        return deferred.promise;
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

        var courseIndex = self.getActiveCourseIDs().indexOf(course.id);
        if(courseIndex === -1) {
          currentUser.active_courses.push(course);
        } else {
          currentUser.active_courses.splice(courseIndex, 1);
        }

        $rootScope.$broadcast('filteredCourse');

        $http.post('http://localhost:8000/' + 'courses/filter/', {'course_id' : course.id})
        .success(function(data) {
          console.log('filteredCourse');
        })
        .error(function(error) {
          var courseIndex = self.getActiveCourseIDs().indexOf(course.id);
          if(courseIndex === -1) {
            currentUser.active_courses.push(course);
          } else {
            currentUser.active_courses.splice(courseIndex, 1);
          }

          $rootScope.$broadcast('filteredCourse');

          course.active = !course.active; // Flip the UI back to whatever its value was previously
        });
      } else {
        var deferred = $q.defer();
        var courseIndex = self.getActiveCourseIDs().indexOf(course.id);
        if(courseIndex === -1) {
          currentUser.active_courses.push(course);
        } else {
          currentUser.active_courses.splice(courseIndex, 1);
        }

        $rootScope.$broadcast('filteredCourse');
        deferred.resolve();
        return deferred.promise;
      }
    };

    this.createSession = function(courseID, startTime, endTime, location, roomNumber, participants, description) {
      if(AuthService.isAuthenticated()) {
        return $http.post('http://localhost:8000/' + 'sessions/create/', {
                'coordinator' : currentUser.id,
                'course' : courseID,
                'start_time' : startTime,
                'end_time' : endTime,
                'location' : location.id,
                'room_number' : roomNumber,
                'max_participants' : participants,
                'description' : description,
        });
      }
    };

    this.createOffCampusSession = function(courseID, startTime, endTime, latitude, longitude, address_string, participants, description) {
      if(AuthService.isAuthenticated()) {
        return $http.post('http://localhost:8000/' + 'sessions/create/', {
                'coordinator' : currentUser.id,
                'course' : courseID,
                'start_time' : startTime,
                'end_time' : endTime,
                'latitude' : latitude,
                'longitude' : longitude,
                'name' : address_string,
                'max_participants' : participants,
                'description' : description,
        });
      }
    };    

    this.clearState = function() {
      selectedUniversity = {};
      availableCourses = [];
      universityBuildings = [];
      selectedCourses = [];
      availableSessions = [];
      currentUser = {};
      currentUser.active_courses = [];
    };

    this.logout = function()  {
      self.clearState();
    };

  });
