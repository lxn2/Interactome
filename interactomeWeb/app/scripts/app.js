'use strict';

angular.module('interactomeApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute'
  //'bootstrap.js'
])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
