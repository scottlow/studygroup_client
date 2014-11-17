'use strict';
//weblog.asp.net/dwahlin/archive/2013/08/16/using-an-angularjs-factory-to-interact-with-a-restful-service.aspx
angular.module('studygroupClientApp')
  .factory('DataFactory', ['$http', function ($http) {
    // Service logic
    // ...

    var urlbase = 'http://localhost:8000/';
    var DataFactory = {};

    dataFactory.getUniversities() = function() {
        return $http.get(urlbase + 'universities/list');
    };

    dataFactory.getAccount = function() {
        return $http.get(urlbase + 'account');
    };

    dataFactory.verifyCredentials = function() {
        return $http.get(urlbase + 'verify_credentials');
    };

    dataFactory.updateProfile = function(profile) {
        return $http.post(urlbase + 'account/update_profile', profile);
    };

    dataFactory.getCoursesByUniversity = function(uni_id, start_date, end_date) {
        //TODO: Fix this call if we include start and end dates
    };

    dataFactory.getUserCourses = function() {
        return $http.get(urlbase + 'courses/list');
    };

    dataFactory.addCourse = function(course_id) {
        return $http.post(urlbase + 'course/add', course_id);
    };

    dataFactory.removeCourse = function(course_id) {
        return $http.post(urlbase + 'course/remove', course_id);
    };

    dataFactory.createSession = function(session) {
        return $http.post(urlbase + 'sessions/create', session);
    };

    dataFactory.getSessionByCourse = function(course_id) {
        return $http.get(urlbase + 'sessions/course/' + course_id);
    };

    dataFactory.getSessionByLocation = function() {
        //TODO: Not properly specced out yet.
    };

    dataFactory.editSession = function(session) {
        $http.post(urlbase + 'sessions/edit', session);
    };

    dataFactory.register = function(user) {
        $http.post(urlbase + 'register', user);
        $http.get(urlbase + 'xmpp/', user);
    };

    return dataFactory;

  }]);
