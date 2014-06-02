'use strict';
var app = angular.module('interactomeApp', [
    'ngRoute',
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngAnimate',
    'interactomeApp.AwsService',
    'interactomeApp.UserService',
    'interactomeApp.RecommendationService',
    'interactomeApp.SearchService',
    'ui.bootstrap'
])

// Sets our AWS arn on config through Awsservice
app.config(function(AwsServiceProvider) {
    AwsServiceProvider
        .setArn(
            'arn:aws:iam::005837367462:role/interactomeRole');
});

// This should allow CORS requests
app.config(function($httpProvider){
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});


// Sets up main route to main.html when page is first loaded. 
app.config(
    function($routeProvider, $locationProvider) {
        $routeProvider
        .when('/', {
            templateUrl: 'views/main.html',
            controller: 'MainCtrl'
        })
        .when('/searchView', {
            templateUrl: 'views/searchview.html',
            controller: 'SearchCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });

        // Removes hashtags in browsers that support html5.
        // will fall back to hashtags if the browser doesnt.
        // Need server url-rewrite support for this which we don't have atm.
        // Leaving in for now to remind us on how to remove the ugly #
        //$locationProvider.html5Mode(true);
    });

window.onLoadCallback = function() {
    // When the document is ready
    angular.element(document).ready(function() {
        // Bootstrap the oauth2 library, a google thing for keeping track of authentication. 
        gapi.client.load('oauth2', 'v2', function() {
            // Finally, bootstrap our angular app
            angular.bootstrap(document, ['interactomeApp']);
        });
    });
};