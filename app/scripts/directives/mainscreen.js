'use strict';

angular.module('studygroupClientApp')
  .directive('mainScreen', function () {
    return {
      templateUrl: 'scripts/directives/mainScreen.html',
      restrict: 'E',
      transclude: true,
      scope: {
      	showInterface: '=',
      	blurMap: '='
      }, 
    };
  })
   .directive('homeMap', function () {
    // This directive is called only once when the initial app is loaded. It's what resets our map to good ol' #YYJ.
    return function ($scope, elem, attrs) {
      var mapOptions,
        latitude = attrs.latitude,
        longitude = attrs.longitude,
        zoom = attrs.zoom,
        map;
        
      console.log(latitude);

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
      $scope.gmap = map;
    };
  });
