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
        $scope.getAvailableSessions = function() {
            // This pane might load faster than the courses are set. If there are no courses, wait a
            // few seconds. If there's still none, show the empty page (TODO)
            $scope.sessions = [];
            var url = "id=";
            angular.forEach($scope.selectedCourses, function(value) {
                url = url + value.id + "&id=";
            });
            url = url.substring(0, url.length - 4);
            return $http.get('http://localhost:8000/' + 'sessions/courses/?' + url).success(function(data) {
                angular.forEach(data, function(value) {
                    $scope.sessions.push(value);
                });
            });
        };
        $scope.$watchCollection('selectedCourses', $scope.getAvailableSessions);
      }]
    };
  });
