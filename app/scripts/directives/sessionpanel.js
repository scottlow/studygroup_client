'use strict';

angular.module('studygroupClientApp')
  .directive('sessionpanel', function ($rootScope, StateService, $http, AuthService) {
    return {
      templateUrl: 'scripts/directives/sessionpanel.html',
      restrict: 'E',
      transclude: true,
      scope: {

      },
      controller: ['$scope', function($scope) {
        $scope.selectedCourses = StateService.getSelectedCourses();
        $scope.sessions = [];
        $scope.sessionIds = [];
        $scope.hostSessions = [];
        $scope.viewSessions = [];

        $scope.AuthService = AuthService;

        var previousIDs = [];

        StateService.setAvailableSessions($scope.sessions);

        $scope.previewSession = function(session) {
            google.maps.event.trigger(session.marker, 'mouseover');
        }

        $scope.dismissPreviewSession = function(session) {
            google.maps.event.trigger(session.marker, 'mouseout', 0);
        }

        $scope.selectSession = function(session) {
            google.maps.event.trigger(session.marker, 'click', true);
        }

        $scope.getAvailableSessions = function(e, values, removeCourseId) {
            var oldSessions = $scope.sessions.slice(); //make a copy of the session list
            var url = "id=";
            var idToRemove;
            var valueIDs = [];
            var tempSessions = [];

            // Get an updated list of the new courseIDs coming in. Leave out the course we'll be removing if applicable.
            for(var i = 0; i < values.length; i++) {
                if(values[i].id !== removeCourseId) {
                    valueIDs.push(values[i].id);
                }
            }

            if(previousIDs.length > valueIDs.length) {
                // We have gotten here because a class was removed. We should delete it from previousIDs
                for(var i = 0; i < previousIDs.length; i++) {
                    if(valueIDs.indexOf(previousIDs[i]) == -1) {
                        // At the same time, we should also delete all client side sessions associated with this course.
                        for(var j = 0; j < $scope.sessions.length; j++) {
                            if($scope.sessions[j].course.id !== previousIDs[i]) {
                                tempSessions.push($scope.sessions[j]);
                            }
                        }
                        previousIDs.splice(i, 1); // Remove this course from previousIDs for the next call that's made
                    }
                }

                // Remove all sessions in $scope.sessions and replace them with the ones that should be there.
                // This is messy, but necessary so as to not break the object reference that StateService has on $scope.sessions.
                $scope.sessions.splice(0, $scope.sessions.length);
                for(var i = 0; i < tempSessions.length; i++) {
                    $scope.sessions.push(tempSessions[i]);
                }

                // Broadcast so that the pins are updated accordingly.
                if($scope.sessions.length === 0) {
                    $rootScope.$broadcast('noSessions', true);                
                }

                $rootScope.$broadcast('sessionsChanged');           
                return; // At this point, we can return since there's no need to make a database call if we're removing.
            }

            // If we've gotten here, it means that we're either adding a course or we are on our initialization pass.
            // Create the url to call, with ids
            angular.forEach(values, function(value) {
                if(previousIDs.indexOf(value.id) === -1) {
                    // Make sure that we're only querying the database for the NEW courses that have been added.
                    url = url + value.id + "&id=";
                    previousIDs.push(value.id);
                }
            });
            url = url.substring(0, url.length - 4); // remove the trailing '&id='
            console.log("Making call using url " + url);
            return $http.get('http://localhost:8000/' + 'sessions/courses/?' + url).success(function(data) {
                // Since we're now dealing with the addition case, we simply need to append any new sessions coming back to our list and update the map pins.
                data.forEach(function(value) {
                        // Convert start and end times to their timezone specific versions.
                        value.start_time = new Date(value.start_time);
                        value.end_time = new Date(value.end_time);
                        value.selected = false;
                        value.hovered = false;
                        value.filterDisplay = false;

                        $scope.getJoinText(value);

                        $scope.sessions.push(value);
                        $scope.sessionIds.push(value.id);
                });
                // This call ensures that all filtering restrictions are taken into consideration when updating the session list/the map pins.
                $scope.filteredCourse();
                console.log($scope.sessions);
            });
        };

        $scope.getJoinText = function(value) {
            var isAttending = false;

            for(var i = 0; i < value.attendees.length; i++) {
                if(value.attendees[i].id === StateService.getUserID()) {
                    isAttending = true;
                    break;
                }
            }                        

            if((value.coordinator && value.coordinator.id === StateService.getUserID()) || isAttending) {
                value.joinText = 'Leave'
            } else {
                value.joinText = 'Join'
            }          
        }

        $scope.addNewSession = function(event, session) {
            $scope.getJoinText(session);
            var session = {
                'id' : -1,
                'attendees' : [],
                'coordinator' : session.coordinator,
                'course' : session.course,
                'location' : session.location,
                'start_time' : session.start_time,
                'end_time' : session.end_time,
                'room_number' : session.room_number,
                'selected': false,
                'hovered': false,
                'joinText': session.joinText,
                'filterDisplay': StateService.getActiveCourseIDs().indexOf(session.course.id) !== -1 ? true : false,
            };
            $scope.sessions.push(session);
            $rootScope.$broadcast('sessionsChanged');            
        };

        $scope.filteredCourse = function() {
            var active_ids = StateService.getActiveCourseIDs();
            for(var i = 0; i < $scope.sessions.length; i++) {
                if(active_ids.indexOf($scope.sessions[i].course.id) !== -1) {
                    $scope.sessions[i].filterDisplay = true;
                } else {
                    $scope.sessions[i].filterDisplay = false;
                    $scope.sessions[i].hovered = false;
                    $scope.sessions[i].selected = false;
                }
            }
            $rootScope.$broadcast('sessionsChanged'); 
            if(active_ids.length == 0) {
                $rootScope.$broadcast('noSessions', true);
            }                       
        }; 

        $scope.displayFilter = function(session) {
            if(session.filterDisplay) {
                return true;
            } else {
                return false;
            }
        };

        $scope.showHostingSessions = function() {
            $rootScope.$emit('displayHostingSessions');
        } 

        $scope.showAttendingSessions = function() {
            $rootScope.$emit('displayAttendingSessions');
        }

        $scope.showAllSessions = function() {
            $rootScope.$emit('displayAllSessions');
        }                    
          
        $scope.$on('filteredCourse', $scope.filteredCourse);     
        $scope.$on('sessionCreated', $scope.addNewSession); // Refactor this to call a different function that simply creates a client side session card.
        $scope.$on('changedCourse', $scope.getAvailableSessions);

        $scope.$on('noSessions', function(evt, shouldShow) {
            $scope.forceShowMessage = shouldShow;
        });
      }]
    };
  });
