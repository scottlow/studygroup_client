'use strict';

angular.module('studygroupClientApp')
  .directive('mainScreen', function (StateService, $rootScope) {
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

        $scope.addCourse = function(course) {
          course.disabled = true;           
          StateService.addCourse(course); 
        };

        $scope.$on('loginProcessed', function(){          
          $scope.selectedCourses = StateService.getSelectedCourses(); 
          $scope.courseList = StateService.getCourseList();          
        });

        $scope.$on('universitySelected', function() {
          // console.log('universitySelected');
          StateService.getCourses().then(function() {
            $scope.courseList = StateService.getCourseList();
          })
        });       

        $scope.removeCourse = function(course) {
          course.disabled = false;          
          StateService.removeCourse(course);
          // for(var i = 0; i < $scope.selectedCourses.length; i++) {
          //   if(course.id === $scope.selectedCourses[i].id) {
          //     $scope.selectedCourses.splice(i, 1);
          //   }
          // }         
        };

        $scope.filterCourse = function(course) {
          StateService.filterCourse(course.id); 
        };

      }],
    };
  })
  .directive('homeMap', function ($rootScope, $timeout) {
    // This directive is called only once when the initial app is loaded. It's what resets our map to good ol' #YYJ.
    return function ($scope, elem, attrs) {
      var mapOptions,
        latitude = $scope.mapLat,
        longitude = $scope.mapLong,
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

      $scope.$watchCollection('[mapLat, mapLong, zoom]', function(newValues, oldValues) {
        var center = new google.maps.LatLng(newValues[0], newValues[1]);
        map.panTo(center);
        map.setZoom(newValues[2]);
      });

      $timeout(function() {
        google.maps.event.trigger(map, 'resize');
        var center = new google.maps.LatLng($scope.mapLat, $scope.mapLong);
        map.setCenter(center);
      });
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