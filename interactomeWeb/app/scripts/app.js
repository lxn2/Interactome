'use strict';
angular.module('interactomeApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute'
    //'bootstrap.js'
])
    .config(function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });
    });

// in scripts/app.js
window.onLoadCallback = function() {
    // When the document is ready
    angular.element(document).ready(function() {
        // Bootstrap the oauth2 library
        gapi.client.load('oauth2', 'v2', function() {
            // Finally, bootstrap our angular app
            angular.bootstrap(document, ['interactomeApp']);
        });
    });
}