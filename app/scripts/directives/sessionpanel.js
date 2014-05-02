'use strict';

angular.module('studygroupClientApp')
  .directive('sessionpanel', function ($rootScope, StateService, $http) {
    return {
      templateUrl: 'scripts/directives/sessionpanel.html',
      restrict: 'E',
      transclude: true,
      scope: {

      },
      controller: ['$scope', function($scope) {
        $scope.selectedCourses = StateService.getSelectedCourses();
        $scope.sessions = [];
        $scope.sessionIds = [];
        $scope.hostSessions = [];
        $scope.viewSessions = [];

        StateService.setAvailableSessions($scope.sessions);

        $scope.previewSession = function(session) {
            google.maps.event.trigger(session.marker, 'mouseover');
        }

        $scope.dismissPreviewSession = function(session) {
            google.maps.event.trigger(session.marker, 'mouseout');
        }

        $scope.selectSession = function(session) {
            google.maps.event.trigger(session.marker, 'click', true);
        }

        $scope.getAvailableSessions = function(values) {
            var oldSessions = $scope.sessions.slice(); //make a copy of the session list
            var id = 1;
            var url = "id=";
            // Create the url to call, with ids
            angular.forEach(values, function(value) {
                if (value.active) {
                    url = url + value.id + "&id=";
                }
            });
            url = url.substring(0, url.length - 4); // remove the trailing '&id='
            console.log("Making call using url " + url);
            return $http.get('http://localhost:8000/' + 'sessions/courses/?' + url).success(function(data) {
                var dataIds = []; //make an array of ids from the results of the REST call
                data.forEach(function(element) {
                    console.log(element.id);
                    dataIds.push(element.id);
                });
                var sessionToSplice = [];
                // Go through each element in the old sessions, and if that old
                // session no longer exists in the REST call, we will remove it from the session list
                // by adding it's id to the 'sessionToSplice' array. Else, if the old session is in the data
                // , remove it from the data because we do not want a second remove.
                oldSessions.forEach(function(element, index) {
                    // If this no longer exists in the data
                    var dataIndex = dataIds.indexOf(element.id);
                    if (!(dataIndex > -1)) {
                        console.log("Not in the data. Remove from sessions");
                        sessionToSplice.push(element);
                    } else {
                        console.log("In the data. Remove from data");
                        data.splice(dataIndex, 1);
                        dataIds.splice(dataIndex,1);
                    }
                });
                // Remove sessions that did not come back in the new REST call
                sessionToSplice.forEach(function(element) {
                    var index = $scope.sessions.indexOf(element);
                    $scope.sessions.splice(index, 1);
                    $scope.sessionIds.splice(index, 1);
                });
                // Push all other sessions from the call into the scoped sessions
                data.forEach(function(value) {
                        // Convert start and end times to their timezone specific versions.
                        value.start_time = new Date(value.start_time);
                        value.end_time = new Date(value.end_time);
                        value.selected = false;
                        value.hovered = false;
                        value.id = id;
                        id += 1;
                        $scope.sessions.push(value);
                        $scope.sessionIds.push(value.id);
                });
                $rootScope.$broadcast('sessionsChanged');
            });
        };
                
        $scope.$watchCollection('selectedCourses', $scope.getAvailableSessions);
        $scope.$on('sessionCreated', $scope.getAvailableSessions);
      }]
    };
  });
