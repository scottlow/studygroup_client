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
          $scope.$broadcast('refreshPins');      
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
            $rootScope.$broadcast('sessionCreated', {'coordinator' : {'username' : StateService.getUsername()}, 'course' : {'name' : $scope.newSessionCourse.full_name, 'id': $scope.newSessionCourse.id}, 'start_time' : $scope.newSessionStartTime, 'end_time' : $scope.newSessionEndTime, 'location' : $scope.newSessionBuilding, 'room_number' : $scope.newSessionRoomNumber}); // Refactor this to pass in the correct information to create a client side session card.            
            StateService.createSession(
                    $scope.newSessionCourse.id, 
                    $scope.newSessionStartTime, 
                    $scope.newSessionEndTime, 
                    $scope.newSessionBuilding, 
                    parseInt($scope.newSessionRoomNumber)
            )
            .success(function() {
              console.log($scope); // Remove this before committing. This is just here to show what data we have in the current scope that could be useful for creating a client side session card.
              console.log('Created session');
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
          scope.active = !scope.active;
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