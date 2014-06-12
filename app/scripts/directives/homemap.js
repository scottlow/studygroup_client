'use strict';

angular.module('studygroupClientApp')
.directive('homeMap', function (StateService, $rootScope, $timeout, $location, $anchorScroll, $compile) {
    // This directive is called only once when the initial app is loaded. It's what resets our map to good ol' #YYJ.
    return {
      scope: {
        lat: '=', // latitude of the map
        long: '=', // longitude of the map
        zoom: '=', // zoom level of the map
        selectedSessions: '=', // list of sessions to be fed into the map for displaying
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

        var oms = new OverlappingMarkerSpiderfier(map, {
          keepSpiderfied: true,
        });

        // This listener will close all open info windows when the map is clicked
        google.maps.event.addListener(map, 'click', function() {
          $scope.closeAllBubbles();
        });

        /* When we need to refresh the pins, ensure that this directive has the latest version of
           the sessions list from MainScreen.js. You may be wondering why this is necessary since
           selectedSessions is bound to MainScreen.sessions. The issue, however, is that the $broadcasting
           of 'refreshPins' is happening faster than the data binding can refresh, and as a result, we *sometimes*
           enter this $on with old data. As a result, we'll update to make sure we're on the latest. */
        $scope.$on('refreshPins', function() { 
          if($scope.selectedSessions !== undefined && $scope.selectedSessions.length === 0) {
            $scope.selectedSessions = $scope.$parent.sessions;          
          }
          if($scope.selectedSessions !== undefined) {
            $scope.refreshPins();  
          }
        });

        $scope.getInfoTemplate = function(session) {
          var infoTemplate = '<div class="search_root session-infowindow media-body session-description-container">' + 
          '<h5 class="media-heading session-heading">' + session.course.name + '</h5><span class="badge duration bubble-duration">' + Math.floor(((session.end_time - session.start_time) % 86400000) / 3600000) + 'h ' + (((session.end_time - session.start_time)  % 86400000) % 3600000) / 60000 + ' m</span>' + 
          '<div class="session-description">' + 
          '<button type="button" ng-class="{\'btn-success\' : ' + (session.joinText=='Join').toString() + ', \'btn-danger\' : ' + (session.joinText=='Leave').toString() + '}" ng-click="joinOrLeaveSession(' + session.id + ')" class="btn btn-sm btn-join">' + session.joinText + '</button>' +
          '<h6 style="pointer-events:none;" class="glyphicon glyphicon-session glyphicon-map-marker"><span class="h5 session-detail"><small>' + session.location.name + '<span class="divider">&#183;</span>Room: ' + session.room_number + '</small></span></h6>' + 
          '<h6 style="pointer-events:none;" class="glyphicon glyphicon-session glyphicon-time"><span class="h5 session-detail"><small>' + session.start_time.toLocaleDateString() + '<span class="divider">&#183;</span>' + session.start_time.toLocaleTimeString() + '</small></span></h6>' + 
          '</div>' +
          '</div>';

          return infoTemplate;
        };

        $scope.$on('refreshBubbles', function() {
          if($scope.selectedSessions !== undefined && $scope.selectedSessions.length === 0) {
            $scope.selectedSessions = $scope.$parent.sessions;          
          }      

          if($scope.selectedSessions !== undefined) {
            for(var i = 0; i < $scope.selectedSessions.length; i++) {
              var infoTemplate = $scope.getInfoTemplate($scope.selectedSessions[i]);
              var compiled = ($compile(infoTemplate)($scope));

              $scope.selectedSessions[i].bubble.setContent(compiled[0]);   

            }
          }
        });

        // Called when a Join button on an info window is clicked.
        $scope.joinOrLeaveSession = function(sessionID) {
          StateService.joinOrLeaveSession(sessionID);
          for(var i = 0; i < $scope.selectedSessions.length; i++) {
            if(sessionID === $scope.selectedSessions[i].id) {
              google.maps.event.trigger($scope.selectedSessions[i].marker, 'click', false);
            }
          }
        }; 

        // Refreshes pins and info windows (bubbles)
        $scope.refreshPins = function() {
          $scope.clearMarkers();
          var index = 0;

          angular.forEach($scope.selectedSessions, function(session) {

            // If the session is actually supposed to be displayed (aka if it's not filtered)
            if(session.filterDisplay) {
              // Create template for bubble
              var infoTemplate = $scope.getInfoTemplate(session);
              
              // Get lat and long for the session marker
              var latLong = new google.maps.LatLng(session.location.latitude, session.location.longitude);
              
              // Create the marker for this session
              var marker = new google.maps.Marker({
                position: latLong,
                map: map,
                title: session.course.name,
                icon: {scaledSize: new google.maps.Size(22, 40), url:"../img/spotlight-poi-blue.png"}
              });

              // Create the info window for this session
              var infowindow = new google.maps.InfoWindow();
              infowindow.setContent(infoTemplate); 
              var compiled = ($compile(infowindow.content)($scope));
              infowindow.setContent(compiled[0]);              

              infowindow.hovered = false;

              // This listener will close all open info windows and open the clicked marker's info window
              google.maps.event.addListener(marker, 'click', function(fromList) {

                if(fromList !== true) {
                  $location.hash(session.id);
                  $anchorScroll();
                }

                // This if prevents a flicker when clicking a marker whose bubble is already displayed
                if(!infowindow.stickyDisplay) {
                  $scope.closeAllBubblesExcept();
                  infowindow.opened = false;            
                  infowindow.stickyDisplay = true;

                  if(infowindow.getMap() === null) {
                    infowindow.open(map, marker);
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

              // Close the infowindow on mouseout
              google.maps.event.addListener(marker, 'mouseout', function(e) {
                var param;
                if(typeof(e) !== 'number') {
                  param = 100; // set a delay in closing an info window if we mouse out from a pin
                } else {
                  param = e; // There will be no delay for mousing out from a session card
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

              // When the infowindow is dislayed, if a user is hovering over it, make sure it stays open
              google.maps.event.addListener(infowindow, 'domready', function() {
                var content = angular.element('.search_root');
                content.parent().parent().parent().mouseover(function() { // This is nasty, but necessary due to the fact that Google Maps doesn't let devs access DOM structure easily.
                  if(!infowindow.hovered) {
                    infowindow.hovered = true;
                  }
                });

                // Likewise, if a user mouses out from an info window, close it.
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

              if(session.coordinator.id === StateService.getUserObj().id) {
                marker.setIcon({scaledSize: new google.maps.Size(22, 40), url:"../img/spotlight-poi-green.png"});
              } else {
                for (var i = 0; i < session.attendees.length; i++) {
                  if(session.attendees[i].username == StateService.getUserObj().username) {
                    marker.setIcon({scaledSize: new google.maps.Size(22, 40), url:"../img/spotlight-poi-yellow.png"}); 
                    break;                     
                  }
                }
              }

              session.marker = marker;
              session.bubble = infowindow;

              if(session.selected) {
                infowindow.open(map,marker);
              }

              // Push each infowindow and marker to their respective list to keep track of them
              bubbles.push(infowindow);
              markers.push(marker);

              oms.addMarker(marker);
            }
            index ++;            
          });
		      $rootScope.$broadcast('pinsLoaded');
        };

        // Close all bubbles on the map
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

        // Close all bubbles except for the one that's already open
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

        // Witchcraft. Don't ask what this does or how it works. Essentially, it just ensures that AngularJS can safely call $apply
        // without having it conflict with any existing $digest/$apply calls
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

        // Completely clear all markers on the map
        $scope.clearMarkers = function() {
          for(var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
          }
          markers = [];
          bubbles = [];
          oms.clearMarkers();
        };

        // If lat, long or zoom parameters on the map change (remember, these are passed in from HTML), update it accordingly.
        $scope.$watchCollection('[lat, long, zoom]', function(newValues, oldValues) {
          var center = new google.maps.LatLng(newValues[0], newValues[1]);
          map.panTo(center);
          map.setZoom(newValues[2]);

          // Timeout of 0ms is necessary here.
          $timeout(function() {
            google.maps.event.trigger(map, 'resize');
            var center = new google.maps.LatLng($scope.lat, $scope.long);
            map.setCenter(center);
          });
        });
      },
    };
  });
