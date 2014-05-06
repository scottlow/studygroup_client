'use strict';

angular.module('studygroupClientApp')
.directive('homeMap', function ($rootScope, $timeout, $location, $anchorScroll) {
    // This directive is called only once when the initial app is loaded. It's what resets our map to good ol' #YYJ.
    return {
      scope: {
        lat: '=',
        long: '=',
        zoom: '=',
        selectedSessions: '=',
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

        // This listener will close all open info windows when the map is clicked
        google.maps.event.addListener(map, 'click', function() {
          $scope.closeAllBubbles();
        });

        $scope.$on('refreshPins', function() {
          $scope.clearMarkers();    
          if($scope.selectedSessions !== undefined && $scope.selectedSessions.length === 0) {
            $scope.selectedSessions = $scope.$parent.sessions;          
          }
          if($scope.selectedSessions !== undefined && $scope.selectedSessions.length !== 0) {
            $scope.refreshPins();  
          }
        });   

        $scope.refreshPins = function() {
          $scope.clearMarkers();
          var index = 0;

          angular.forEach($scope.selectedSessions, function(session) {

            if(session.filterDisplay) {
              // Create template for bubble
              var infoTemplate = '<div class="search_root session-infowindow media-body session-description-container">' + 
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

              infowindow.hovered = false;

              // This listener will close all open info windows and open the clicked marker's info window
              google.maps.event.addListener(marker, 'click', function(fromList) {
                // This if prevents a flicker when clicking a marker whose bubble is already displayed
                if(!infowindow.stickyDisplay) {
                  $scope.closeAllBubblesExcept();
                  infowindow.opened = false;            
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
                  infowindow.opened = true;

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

              google.maps.event.addListener(marker, 'mouseout', function(e) {
                var param;
                if(typeof(e) !== 'number') {
                  param = 100;
                } else {
                  param = e;
                }
                $timeout(function(){
                  if(!infowindow.stickyDisplay && !infowindow.hovered) {
                    infowindow.close(map,marker);
                    infowindow.opened = false;

                    $scope.safeApply(function() {
                      session.hovered = false;
                    });                  
                  }
                }, param);
              });

              google.maps.event.addListener(infowindow, 'domready', function() {
                var content = angular.element('.search_root');
                content.parent().parent().parent().mouseover(function() { // This is nasty, but necessary due to the fact that Google Maps doesn't let
                  if(!infowindow.hovered) {
                    infowindow.hovered = true;
                  }
                });
              });

              google.maps.event.addListener(infowindow, 'domready', function() {
                var content = angular.element('.search_root');
                content.parent().parent().parent().mouseout(function() {
                  if(infowindow.hovered) {
                    infowindow.hovered = false;
                    google.maps.event.trigger(marker, 'mouseout');
                  }
                });
              });

              google.maps.event.addListener(infowindow, 'mouseout', function() {
                infowindow.hovered = false;
              });              

              // This listener will close all open info windows when the marker's close button is pressed.
              // This is *technically* not the correct behaviour, but since we'll only ever have one
              // marker open at any time, we can reset these.
              google.maps.event.addListener(infowindow, 'closeclick', function() {
                $scope.closeAllBubbles();
              });              

              // Push each infowindow and marker to their respective session objects so that they can be used in SessionPanel
              marker.lookupIndex = index;
              infowindow.lookupIndex = index;

              session.marker = marker;
              session.bubble = infowindow;

              // Push each infowindow and marker to their respective list to keep track of them
              bubbles.push(infowindow);
              markers.push(marker);
            }
            index ++;            
          });
        };

        $scope.closeAllBubbles = function() {
          for(var i = 0; i < bubbles.length; i++) {
            bubbles[i].stickyDisplay = false;
            bubbles[i].close(map, markers[i]);
            
            $scope.safeApply(function() {
              $scope.selectedSessions[bubbles[i].lookupIndex].selected = false;  
              $scope.selectedSessions[bubbles[i].lookupIndex].hovered = false; 
              bubbles[i].hovered = false; 
            });
          }
        }

        $scope.closeAllBubblesExcept = function() {
          for(var i = 0; i < bubbles.length; i++) {
            if(!bubbles[i].opened) {
              bubbles[i].hovered = false;              
              bubbles[i].stickyDisplay = false;
              bubbles[i].close(map, markers[i]);
              $scope.selectedSessions[bubbles[i].lookupIndex].selected = false;
              $scope.selectedSessions[bubbles[i].lookupIndex].hovered = false;              
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
  });
