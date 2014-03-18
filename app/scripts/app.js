'use strict';

angular.module('studygroupClientApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'ngAnimate',
  'clientControllers',
  'dashboardControllers',
  'clientServices',
  'ui.router'
])
  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state("main", {
      url: '/',
      templateUrl: 'views/main.html',
      controller: 'MainCtrl'
    })
    .state("dashboard", {
      url: '/dashboard',
      templateUrl: 'views/dashboard.html',
      controller: 'DashboardCtrl'
    });
    $urlRouterProvider.otherwise("/");    
  })
  .run(['$state', function ($state) {
    $state.transitionTo('main');
  }]);