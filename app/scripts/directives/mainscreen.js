'use strict';

angular.module('studygroupClientApp')
  .directive('mainScreen', function (StateService) {
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
        $scope.courseList = StateService.getCourseList();
        $scope.selectedCourses = [];

        $scope.addCourse = function(course) {
          StateService.addCourse(course.id, course.name);
          $scope.selectedCourses.push(course);
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
      template: '<button type="button" class="btn btn-default" ng-transclude></button>',
    }
  });