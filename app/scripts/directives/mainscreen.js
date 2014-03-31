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
          return new Date(Math.round(date.getTime() / coeff) * coeff)
        };

        $scope.addHours = function(date, h) {
          return new Date(date.setHours(date.getHours() + h))
        };     

        $scope.today = function() {
          $scope.newSessionStartDate = new Date();
        };

        $scope.open = function($event) {
          $event.preventDefault();
          $event.stopPropagation();

          $scope.opened = true;
        };        

        if(AuthService.isAuthenticated()) {
          $scope.showCreateNewSession = true;
        };

        $scope.addCourse = function(course) {
          course.disabled = true;           
          StateService.addCourse(course); 
        };

        $scope.$on('loginProcessed', function(){          
          $scope.selectedCourses = StateService.getSelectedCourses(); 
          $scope.courseList = StateService.getCourseList();
          $scope.newSessionCourse = $scope.selectedCourses[0];
          $scope.university = StateService.getUniversity();
        });

        $scope.$on('universitySelected', function() {
          // console.log('universitySelected');
          StateService.getCourses().then(function() {
            $scope.selectedCourses = StateService.getSelectedCourses();  
            $scope.newSessionCourse = $scope.selectedCourses[0];
            $scope.courseList = StateService.getCourseList();
            $scope.university = StateService.getUniversity();
          })
        }); 

        $scope.showNewSessionModal = function() {
          $scope.buildingList = [];
          StateService.getUniversityBuildings().then(function() {
            $scope.buildingList = StateService.getBuildingList();
            $scope.newSessionBuilding = $scope.buildingList[0];
            $scope.today();
            $scope.newSessionStartTime = $scope.roundTimeToNearestFive(new Date());
            $scope.newSessionEndTime = $scope.roundTimeToNearestFive($scope.addHours(new Date(), 1));
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
          if(scope.active == 'active') {
            scope.active = ''
          } else {
            scope.active = 'active';
          }
          scope.$parent.filterCourse(scope.$parent.course);
        }
        scope.removeCourse = function() {
          scope.$parent.removeCourse(scope.$parent.course);
        }
      },
    };
  });