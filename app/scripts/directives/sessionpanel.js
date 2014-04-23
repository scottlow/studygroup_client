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
            google.maps.event.trigger(session.marker, 'click');
        }

        $scope.getAvailableSessions = function(values) {
            var oldSessions = $scope.sessions.slice();
            var url = "id=";
            angular.forEach($scope.selectedCourses, function(value) {
                url = url + value.id + "&id=";
            });
            url = url.substring(0, url.length - 4);
            console.log("Making call using url " + url);
            return $http.get('http://localhost:8000/' + 'sessions/courses/?' + url).success(function(data) {
                var dataIds = [];
                data.forEach(function(element) {
                    console.log(element.id);
                    dataIds.push(element.id);
                });
                var sessionToSplice = [];
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
                sessionToSplice.forEach(function(element) {
                    var index = $scope.sessions.indexOf(element);
                    $scope.sessions.splice(index, 1);
                    $scope.sessionIds.splice(index, 1);
                });
                data.forEach(function(value) {
                        // Convert start and end times to their timezone specific versions.
                        value.start_time = new Date(value.start_time);
                        value.end_time = new Date(value.end_time);
                        value.selected = false;
                        value.hovered = false;
                        $scope.sessions.push(value);
                        $scope.sessionIds.push(value.id);
                });
                $rootScope.$broadcast('sessionsChanged');
            });
        };
                
        $scope.$watchCollection('selectedCourses', $scope.getAvailableSessions);
      }]
    };
  });
