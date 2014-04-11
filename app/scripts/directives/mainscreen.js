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

        var modal = angular.element('#newSessionModal');
        modal.on('shown.bs.modal', function(e) {
          $timeout(function() {
            $scope.buildingLat = $scope.newSessionBuilding.latitude;
            $scope.buildingLong = $scope.newSessionBuilding.longitude;
          });
        });

        $scope.newSessionSubmit = function() {
          $scope.newSessionSubmitted = true;
          console.log($scope);
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

        $scope.$watchCollection('[newSessionStartTime, newSessionDurationHours, newSessionDurationMins]', function() {
          $scope.computeEndTime();
        });

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

        if(AuthService.isAuthenticated()) {
          $scope.showCreateNewSession = true;
        }

        $scope.addCourse = function(course) {
          course.disabled = true;
          StateService.addCourse(course);
        };

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
          StateService.filterCourse(course.id);
        };

      }],
    };
  })
  .directive('homeMap', function ($rootScope, $timeout) {
    // This directive is called only once when the initial app is loaded. It's what resets our map to good ol' #YYJ.
    return {
      scope: {
        lat: '=',
        long: '=',
        zoom: '=',
      },
      link: function ($scope, elem, attrs) {
        var mapOptions,
          latitude = $scope.lat,
          longitude = $scope.long,
          zoom = $scope.zoom,
          map;

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
        active: '@active',
      },
      template: '<div ng-class="active" class="course-btn btn btn-default" ng-click="filterCourse()" ng-transclude></div><div class="course-close-btn btn btn-primary" ng-click="removeCourse()"><span class="h6 glyphicon glyphicon-remove"></span></div>',
      link: function(scope, elements, attrs) {
        scope.filterCourse = function() {
          if(scope.active === 'active') {
            scope.active = '';
          } else {
            scope.active = 'active';
          }
          scope.$parent.filterCourse(scope.$parent.course);
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