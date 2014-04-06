'use strict';
var app = angular.module('interactomeApp', [
    'ngRoute',
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'interactomeApp.AwsService',
    'interactomeApp.Userservice',
    'interactomeApp.RecommendationService',
    'ui.bootstrap'
])

// Sets our AWS arn on config through Awsservice
app.config(function(AwsServiceProvider) {
    AwsServiceProvider
        .setArn(
            'arn:aws:iam::005837367462:role/interactomeRole');
});



// Sets up main route to main.html when page is first loaded. 
app.config(
    function($routeProvider) {
        $routeProvider

        .when('/', {
            templateUrl: 'views/main.html',
            controller: 'MainCtrl'
        })
            .when('/searchView', {
                templateUrl: 'views/searchview.html',
                controller: 'SearchCtrl'


            })
        /*
            .otherwise({
                redirectTo: 'views/main.html',
                controller: 'MainCtrl'
            });
*/
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