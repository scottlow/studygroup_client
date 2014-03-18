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
      controller: 'MainCtrl',
      authenticate: false
    })
    .state('dashboard', {
      url: '/dashboard',
      templateUrl: 'views/dashboard.html',
      controller: 'DashboardCtrl',
      authenticate: true      
    });
    $urlRouterProvider.otherwise("/");    
  })
  .run(function ($rootScope, $state, AuthService) {
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
      if(toState.url === '/') {
        // We are hitting the root of the page. If this is happeneing, we should check to see if the user has the cookie set to login.
        $state.transitionTo(AuthService.isAuthenticated() ? 'dashboard' : 'main', null, {location: 'replace'});
        event.preventDefault();
      }
      if (toState.authenticate && !AuthService.isAuthenticated()){
        // User isn’t authenticated
        $state.transitionTo('main');
        event.preventDefault(); 
      }
    });
  });