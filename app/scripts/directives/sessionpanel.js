'use strict';

angular.module('studygroupClientApp')
  .directive('sessionpanel', function (StateService, $http) {
    return {
      templateUrl: 'scripts/directives/sessionpanel.html',
      restrict: 'E',
      transclude: true,
      scope: {

      },
      controller: ['$scope', function($scope) {
        $scope.selectedCourses = StateService.getSelectedCourses();
        $scope.sessions = [];
        $scope.hostSessions = [];
        $scope.viewSessions = [];
        $scope.getAvailableSessions = function(values) {
            var oldSessions = $scope.sessions.slice();
            var url = "id=";
            angular.forEach(values, function(value) {
                url = url + value.id + "&id=";
            });
            url = url.substring(0, url.length - 4);
            return $http.get('http://localhost:8000/' + 'sessions/courses/?' + url).success(function(data) {
                oldSessions.forEach(function(element, index) {
                    // If this no longer exists in the data
                    var dataIndex = data.indexOf(element);
                    if (dataIndex > -1) {
                        $scope.sessions.splice(index, 1);
                        data.splice(dataIndex, 1);
                    }
                });
                angular.forEach(data, function(value) {
                        $scope.sessions.push(value);
                });
            });
        };
        $scope.$watchCollection('selectedCourses', $scope.getAvailableSessions);
      }]
    };
  });
