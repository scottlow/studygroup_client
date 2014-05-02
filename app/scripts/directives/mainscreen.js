'use strict';

angular.module('studygroupClientApp')
  .directive('mainScreen', function (StateService, $rootScope, AuthService, $timeout) {
    return {
      templateUrl: 'scripts/directives/mainScreen.html',
      restrict: 'E',
      transclude: true,
      scope: {
        showInterface: '=',
        blurMap: '=',
        mapLat: '=',
        mapLong: '=',
        zoom: '=',
      },
      controller: ['$scope', function($scope) {
        $scope.courseList = [];
        $scope.selectedCourses = [];
        $scope.active = '';
        $scope.buildingList = [];
        $scope.minDate = new Date();
        $scope.newSessionSubmitted = false;
        $scope.buildingLat = 48.4428524;
        $scope.buildingLong = -123.3592758;
        $scope.newSessionStartTime = new Date();
        $scope.sessions = [];

        if(AuthService.isAuthenticated()) {
          $scope.showCreateNewSession = true;
        }     

        $scope.$on('loginProcessed', function(){
          $scope.selectedCourses = StateService.getSelectedCourses();
          $scope.courseList = StateService.getCourseList();
          $scope.newSessionCourse = $scope.selectedCourses[0];
          $scope.university = StateService.getUniversity();
          $scope.showNewSessionModal();
        });

        $scope.$on('universitySelected', function() {
          // console.log('universitySelected');
          StateService.getCourses().then(function() {
            $scope.selectedCourses = StateService.getSelectedCourses();
            $scope.newSessionCourse = $scope.selectedCourses[0];
            $scope.courseList = StateService.getCourseList();
            $scope.university = StateService.getUniversity();
          });
        });

        $scope.$on('sessionsChanged', function() {
          $scope.sessions = StateService.getAvailableSessions();
        });       

        $scope.$watchCollection('[newSessionStartTime, newSessionDurationHours, newSessionDurationMins]', function() {
          $scope.computeEndTime();
        });

        var modal = angular.element('#newSessionModal');
        modal.on('shown.bs.modal', function(e) {
          $timeout(function() {
            $scope.buildingLat = $scope.newSessionBuilding.latitude;
            $scope.buildingLong = $scope.newSessionBuilding.longitude;
          });
        });

        $scope.newSessionSubmit = function() {
          $scope.newSessionSubmitted = true;
          angular.element('#newSessionModal').modal('hide');
          if($scope.newSessionForm.$valid) {
            StateService.createSession(
                    $scope.newSessionCourse.id, 
                    $scope.newSessionStartTime, 
                    $scope.newSessionEndTime, 
                    $scope.newSessionBuilding, 
                    parseInt($scope.newSessionRoomNumber)
            )
            .success(function() {
              console.log('Created session');
              $rootScope.$broadcast('sessionCreated');
            })
            .error(function() {
              console.log('Error creating session');
            });
          }
        };

        $scope.buildingChange = function() {
          $scope.buildingLat = $scope.newSessionBuilding.latitude;
          $scope.buildingLong = $scope.newSessionBuilding.longitude;
        };

        $scope.roundTimeToNearestFive = function(date) {
          var coeff = 1000 * 60 * 5;
          return new Date(Math.round(date.getTime() / coeff) * coeff);
        };

        $scope.computeEndTime = function() {
          if($scope.newSessionStartTime ==   null) {
            return;
          }        
          $scope.newSessionEndTime = $scope.roundTimeToNearestFive($scope.newSessionStartTime);
          $scope.newSessionEndTime.setMinutes($scope.newSessionEndTime.getMinutes() + ($scope.newSessionDurationMins == null ? 0 : parseInt($scope.newSessionDurationMins)));
          $scope.newSessionEndTime.setHours($scope.newSessionEndTime.getHours() + ($scope.newSessionDurationHours == null ? 0 : parseInt($scope.newSessionDurationHours)));
        };

        $scope.initTimes = function() {
          $scope.newSessionStartTime = $scope.roundTimeToNearestFive(new Date());      
          $scope.newSessionDurationHours = '1';
          $scope.newSessionDurationMins = '00';
          $scope.computeEndTime();
        };       

        $scope.open = function($event) {
          $event.preventDefault();
          $event.stopPropagation();

          $scope.opened = true;
        };

        $scope.addCourse = function(course) {
          course.disabled = true;
          StateService.addCourse(course);
        };

        $scope.showNewSessionModal = function() {
          $scope.buildingList = [];
          StateService.getUniversityBuildings().then(function() {
            $scope.buildingList = StateService.getBuildingList();
            $scope.newSessionBuilding = $scope.buildingList[0];
            $scope.initTimes();            
          });
        };

        $scope.removeCourse = function(course) {
          course.disabled = false;
          StateService.removeCourse(course);
        };

        $scope.filterCourse = function(course) {
          return StateService.filterCourse(course);
        };

      }],
    };
  })
  .directive('homeMap', function ($rootScope, $timeout, $location, $anchorScroll) {
    // This directive is called only once when the initial app is loaded. It's what resets our map to good ol' #YYJ.
    return {
      scope: {
        lat: '=',
        long: '=',
        zoom: '=',
        selectedSessions: '='
      },
      link: function ($scope, elem, attrs) {
        var mapOptions,
          latitude = $scope.lat,
          longitude = $scope.long,
          zoom = $scope.zoom,
          map,
          markers = [],
          bubbles = [],

        latitude = latitude && parseFloat(latitude, 10) || 48.4630959;
        longitude = longitude && parseFloat(longitude, 10) || -123.3121053;
        zoom = zoom && parseInt(zoom) || 10;

        mapOptions = {
          zoomControl: false,
          panControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          zoom: zoom,
          center: new google.maps.LatLng(latitude, longitude)
        };

        map = new google.maps.Map(elem[0], mapOptions);

        $scope.$watchCollection('selectedSessions', function(newVal, oldVal) {
          $scope.clearMarkers();     
          if(newVal !== oldVal && $scope.selectedSessions.length !== 0) {
            console.log($scope.selectedSessions);          
            angular.forEach($scope.selectedSessions, function(session) {

              // Create template for bubble
              var infoTemplate = '<div class="media-body session-description-container">' + 
              '<h5 class="media-heading session-heading">' + session.course.name + '</h5><span class="badge duration bubble-duration">' + Math.floor(((session.end_time - session.start_time) % 86400000) / 3600000) + 'h ' + (((session.end_time - session.start_time)  % 86400000) % 3600000) / 60000 + ' m</span>' + 
              '<div class="session-description">' + 
              '<button type="button" class="btn btn-success btn-sm btn-join">Join</button>' + 
              '<h6 style="pointer-events:none;" class="glyphicon glyphicon-session glyphicon-map-marker"><span class="h5 session-detail"><small>' + session.location.name + '<span class="divider">&#183;</span>Room: ' + session.room_number + '</small></span></h6>' + 
              '<h6 style="pointer-events:none;" class="glyphicon glyphicon-session glyphicon-time"><span class="h5 session-detail"><small>' + session.start_time.toLocaleDateString() + '<span class="divider">&#183;</span>' + session.start_time.toLocaleTimeString() + '</small></span></h6>' + 
              '</div>' +
              '</div>';
              // Get lat and long for the session marker
              var latLong = new google.maps.LatLng(session.location.latitude, session.location.longitude);
              
              // Create the marker for this session
              var marker = new google.maps.Marker({
                position: latLong,
                map: map,
                title: session.course.name
              });

              // Create the info window for this session
              var infowindow = new google.maps.InfoWindow({
                  content: infoTemplate,
              });

              // This listener will close all open info windows and open the clicked marker's info window
              google.maps.event.addListener(marker, 'click', function(fromList) {
                // This if prevents a flicker when clicking a marker whose bubble is already displayed
                if(!infowindow.stickyDisplay) {
                  $scope.closeAllBubblesExcept();
                  infowindow.hovered = false;            
                  infowindow.stickyDisplay = true;

                  if(!(fromList === true)) {
                    $location.hash(session.id);
                    $anchorScroll();
                  }

                  $scope.safeApply(function() {
                    session.selected = true;
                  });
                }
              });

              google.maps.event.addListener(marker, 'mouseover', function() { 
                // This if prevents a flicker when mousing over a marker whose bubble is already displayed 
                if(!infowindow.stickyDisplay) {          
                  infowindow.open(map,marker);
                  infowindow.hovered = true;

                  $scope.safeApply(function() {
                    session.hovered = true;
                  });                  
                } else {
                  // This is a hacky workaround to display bubbles that are off the map, but already open.
                  if(!(map.getBounds().contains(marker.getPosition()))) {
                    infowindow.open(map, marker);
                  }
                }                  
              });

              google.maps.event.addListener(marker, 'mouseout', function() {
                if(!infowindow.stickyDisplay) {
                  infowindow.close(map,marker);
                  infowindow.hovered = false;

                  $scope.safeApply(function() {
                    session.hovered = false;
                  });                  
                }
              });   

              // This listener will close all open info windows when the map is clicked
              // google.maps.event.addListener(map, 'click', function() {
              //   $scope.closeAllBubbles(); // For some reason, the safeApply is causing this to "lag". I'll look into it.
              // });

              // This listener will close all open info windows when the marker's close button is pressed.
              // This is *technically* not the correct behaviour, but since we'll only ever have one
              // marker open at any time, we can reset these.
              google.maps.event.addListener(infowindow, 'closeclick', function() {
                $scope.closeAllBubbles();
              });              

              // Push each infowindow and marker to their respective session objects so that they can be used in SessionPanel
              session.marker = marker;
              session.bubble = infowindow;

              // Push each infowindow and marker to their respective list to keep track of them
              bubbles.push(infowindow);
              markers.push(marker);
            });
          }
        });

        $scope.closeAllBubbles = function() {
          for(var i = 0; i < bubbles.length; i++) {
            bubbles[i].stickyDisplay = false;
            bubbles[i].close(map, markers[i]);
            
            $scope.safeApply(function() {
              $scope.selectedSessions[i].selected = false;  
              $scope.selectedSessions[i].hovered = false;  
            });
          }
        }

        $scope.closeAllBubblesExcept = function() {
          for(var i = 0; i < bubbles.length; i++) {
            if(!bubbles[i].hovered) {
              bubbles[i].stickyDisplay = false;
              bubbles[i].close(map, markers[i]);
              $scope.selectedSessions[i].selected = false;
              $scope.selectedSessions[i].hovered = false;              
            }
          }
        } 

        $scope.safeApply = function(fn) {
          var phase = this.$root.$$phase;
          if(phase == '$apply' || phase == '$digest') {
            if(fn && (typeof(fn) === 'function')) {
              fn();
            }
          } else {
            this.$apply(fn);
          }
        };               

        $scope.clearMarkers = function() {
          for(var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
          }
          markers = [];
          bubbles = [];
        };

        $scope.$watchCollection('[lat, long, zoom]', function(newValues, oldValues) {
          var center = new google.maps.LatLng(newValues[0], newValues[1]);
          map.panTo(center);
          map.setZoom(newValues[2]);

          $timeout(function() {
            google.maps.event.trigger(map, 'resize');
            var center = new google.maps.LatLng($scope.lat, $scope.long);
            map.setCenter(center);
          });
        });

        $timeout(function() {
          google.maps.event.trigger(map, 'resize');
          var center = new google.maps.LatLng($scope.lat, $scope.long);
          map.setCenter(center);
        });
      },
    };
  })
  .directive('courseButton', function() {
    return {
      restrict: 'E',
      transclude: true,
      require: '^mainScreen',
      scope: {
        active: '=active',
      },
      template: '<div ng-class="{active : active}" class="course-btn btn btn-default" ng-click="filterCourse()" ng-transclude></div><div class="course-close-btn btn btn-primary" ng-click="removeCourse()" ng-class="{loading : loading, notloading : !loading}"><span ng-show="loading"><img class="spinner" src="../img/spinner.gif" /></span><span ng-show="!loading"class="h6 glyphicon glyphicon-remove"></span></div>',
      link: function(scope, elements, attrs) {
        scope.filterCourse = function() {
          scope.loading = true;          
          if(scope.active === true) {
            scope.active = false;
          } else {
            scope.active = true;
          }
          scope.$parent.filterCourse(scope.$parent.course).then(function(){
            scope.loading = false;
          });
        };
        scope.removeCourse = function() {
          scope.$parent.removeCourse(scope.$parent.course);
        };
      },
    };
  })
  .directive('integer', function() {
    var INTEGER_REGEXP = /^\-?\d+$/;    
    return {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl) {
        ctrl.$parsers.unshift(function(viewValue) {
          if (INTEGER_REGEXP.test(viewValue)) {
            // it is valid
            ctrl.$setValidity('integer', true);
            return viewValue;
          } else {
            // it is invalid, return undefined (no model update)
            ctrl.$setValidity('integer', false);
            return undefined;
          }
        });
      }
    };
  });