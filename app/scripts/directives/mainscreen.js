'use strict';

angular.module('studygroupClientApp')
  .directive('mainScreen', function (StateService, $rootScope, AuthService, $timeout, $window) {
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
        $scope.courseList = []; // List of courses available for a user to choose from
        $scope.selectedCourses = []; // List of courses a user has added to his/her profile (displayed in the course bar)
        $scope.buildingList = []; // List of buildings available for a user to host a session in
        $scope.minDate = new Date(); // Minimum allowed date for session creation (not allowed to host sessions in the past!)
        $scope.newSessionSubmitted = false; // True if the new session modal has been submitted (used to know when to display validation)
        $scope.buildingLat = 48.4428524; // Latitude of selected building in the new session dialog. Default value is assigned here.
        $scope.buildingLong = -123.3592758; // Longitude of selected building in the new session dialog. Default value is assigned here.
        $scope.newSessionStartTime = new Date(); // Start date/time of the new session being created
        $scope.sessions = []; // List of sessions available to the user

        // Hide the "New Session" button if the user isn't authenticated
        if(AuthService.isAuthenticated()) {
          $scope.showCreateNewSession = true;
        } 

        angular.element($window).bind('resize', function() {
          $scope.resizeSidebar();
        });            

        $scope.$on('loginProcessed', function(){
          $scope.selectedCourses = StateService.getSelectedCourses(); // Get selected courses for specific user from the StateService

          // Activate informational popover if the user has no courses added
          if($scope.selectedCourses.length === 0) {
            angular.element('#noCoursePopover').popover({ trigger: "hover", html: "true" });            
          }

          // Initialize various state variables
          $scope.courseList = StateService.getCourseList();
          $scope.newSessionCourse = $scope.selectedCourses[0];
          $scope.university = StateService.getUniversity();
          $scope.showNewSessionModal(); // Misleading name, but this initializes various values in the new session modal.
        });

        // When a university is selected from the main page, initialize the correct variables
        $scope.$on('universitySelected', function() {
          // console.log('universitySelected');
          StateService.getCourses().then(function() {
            $scope.selectedCourses = StateService.getSelectedCourses();
            $scope.newSessionCourse = $scope.selectedCourses[0];
            $scope.courseList = StateService.getCourseList();
            $scope.university = StateService.getUniversity();

            if($scope.selectedCourses.length === 0) {
              angular.element('#noCoursePopover').popover({ trigger: "hover", html: "true" });            
            }

          });
        });

        $scope.resizeSidebar = function() {
          var height = angular.element('#sidebarRoot').height() - 147;
          angular.element('.session-panel .tab-content').height(height);          
        };

        // Whenever the session list is updated, ensure that MainScreen has the most recent copy from the StateService
        // and update the map pins/bubbles accordingly
        $scope.$on('sessionsChanged', function() {          
          $scope.sessions = StateService.getAvailableSessions();
          if($scope.sessions.length === 0) {
            $rootScope.$broadcast('noSessions', true);            
          } else {
            $rootScope.$broadcast('noSessions', false);            
          }
          $scope.$broadcast('refreshPins');  
          $scope.resizeSidebar(); 
        });       

        // If the start time or duration of a session are changed in the create session dialog, compute the new resulting end time.
        $scope.$watchCollection('[newSessionStartTime, newSessionDurationHours, newSessionDurationMins]', function() {
          $scope.computeEndTime();
        });

        // Initalize a few variables on modal dialog launch. (This is so buildings display correctly in the dialog)
        var modal = angular.element('#newSessionModal');
        modal.on('shown.bs.modal', function(e) {
          $timeout(function() {
            $scope.buildingLat = $scope.newSessionBuilding.latitude;
            $scope.buildingLong = $scope.newSessionBuilding.longitude;
          });
        });

        $scope.popNewSessionModal = function() {
          if(AuthService.isAuthenticated()) {
            angular.element('#newSessionModal').modal('show');              
          } else {
            $rootScope.$broadcast('showRegisterPrompt', false);
          }
        };

        // Called when the user submits the create session dialog
        $scope.newSessionSubmit = function() {
          $scope.newSessionSubmitted = true;
          if($scope.newSessionForm.$valid) {
            angular.element('#newSessionModal').modal('hide');

            // Broadcast new session information to SessionPanel so that the new session card can be instantly created in the UI.
            $rootScope.$broadcast('sessionCreated', {
              'attendees': [],
              'coordinator' : StateService.getUserObj(),
              'course' : {
                'name' : $scope.newSessionCourse.full_name,
                'id': $scope.newSessionCourse.id
              },
              'start_time' : $scope.newSessionStartTime, 
              'end_time' : $scope.newSessionEndTime, 
              'location' : $scope.newSessionBuilding, 
              'room_number' : $scope.newSessionRoomNumber
            });          
            
            // Then, make the time consuming SQL call to create the session server-side
            StateService.createSession(
                    $scope.newSessionCourse.id, 
                    $scope.newSessionStartTime, 
                    $scope.newSessionEndTime, 
                    $scope.newSessionBuilding, 
                    parseInt($scope.newSessionRoomNumber)
            )
            .success(function() {
              console.log('Created session');
              $scope.newSessionSubmitted = false; // Reset any error validation flags
            })
            .error(function() {
              console.log('Error creating session');
            });
          }
        };

        // When a new building is selected, update the map accordingly.
        $scope.buildingChange = function() {
          $scope.buildingLat = $scope.newSessionBuilding.latitude;
          $scope.buildingLong = $scope.newSessionBuilding.longitude;
        };

        // Does exactly what it says :) Round time to the nearest five minutes
        $scope.roundTimeToNearestFive = function(date) {
          var coeff = 1000 * 60 * 5;
          return new Date(Math.round(date.getTime() / coeff) * coeff);
        };

        // Compute the new end time of a session 
        $scope.computeEndTime = function() {
          if($scope.newSessionStartTime ==   null) {
            return;
          }        
          $scope.newSessionEndTime = $scope.roundTimeToNearestFive($scope.newSessionStartTime);
          $scope.newSessionEndTime.setMinutes($scope.newSessionEndTime.getMinutes() + ($scope.newSessionDurationMins == null ? 0 : parseInt($scope.newSessionDurationMins)));
          $scope.newSessionEndTime.setHours($scope.newSessionEndTime.getHours() + ($scope.newSessionDurationHours == null ? 0 : parseInt($scope.newSessionDurationHours)));
        };

        // Initializes the default times/durations in the create session dialog.
        $scope.initTimes = function() {
          $scope.newSessionStartTime = $scope.roundTimeToNearestFive(new Date());      
          $scope.newSessionDurationHours = '1';
          $scope.newSessionDurationMins = '00';
          $scope.computeEndTime();
        };

        // Add a course to the course bar
        $scope.addCourse = function(course) {
          angular.element('#noCoursePopover').popover('destroy'); // Destory the popover on the New Session button that is displayed if a user has no courses added
          course.disabled = true; // Disable the course in the course list
          StateService.addCourse(course); // Add a course to the client and serverside data via StateService.
        };

        // Show the create new session modal
        $scope.showNewSessionModal = function() {
          $scope.buildingList = [];
          StateService.getUniversityBuildings().then(function() {
            $scope.buildingList = StateService.getBuildingList();
            $scope.newSessionBuilding = $scope.buildingList[0];
            $scope.initTimes();            
          });
        };

        // Remove a course from the course bar
        $scope.removeCourse = function(course) {
          course.disabled = false;
          StateService.removeCourse(course);
          if($scope.selectedCourses.length === 0) {
            angular.element('#noCoursePopover').popover({ trigger: "hover", html:"true" }); // Activate informational popover if the user has no more courses added.        
          }
        };

        // Filter a course in the course bar
        $scope.filterCourse = function(course) {
          StateService.filterCourse(course);
        };

        // Remove a course from the client side data
        $scope.removeCourseData = function(course) {
          StateService.removeCourseData(course.id);
        };

      }],
    };
  })
  .directive('courseButton', function() {
    return {
      restrict: 'E',
      transclude: true,
      require: '^mainScreen',
      scope: {
        active: '=active',
        loading: '=loading',
      },
      template: '<div ng-class="{active : active}" class="course-btn btn btn-default" ng-click="filterCourse()" ng-transclude></div><div class="course-close-btn btn btn-primary" ng-click="removeCourse()" ng-class="{loading : loading, notloading : !loading}"><span ng-show="loading"><img class="spinner" src="../img/spinner.gif" /></span><span ng-show="!loading"class="h6 glyphicon glyphicon-remove"></span></div>',
      link: function(scope, elements, attrs) {
        scope.filterCourse = function() {       
          scope.active = !scope.active; // Cause the course button to be permanently pressed/released depending on its previous state
          scope.$parent.filterCourse(scope.$parent.course); // Filter the course by calling $scope.filterCourse above.
        };
        scope.removeCourse = function() {  
          scope.$parent.removeCourseData(scope.$parent.course); // Remove the course from the UI instantaneously
          scope.$parent.removeCourse(scope.$parent.course); // Make the more expensive SQL call to remove the course from the server side data
        };
        scope.$parent.$on('pinsLoaded', function() {
          scope.loading = false; // This stops the loading animation once a specific course has loaded after being added. Right now, it will stop all animations. Known bug.
        });
      },
    };
  })
  .directive('integer', function() {
    // This is a directive to ensure that an input field contains an integer value.
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