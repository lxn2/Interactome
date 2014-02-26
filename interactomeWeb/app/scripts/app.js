'use strict';
angular.module('interactomeApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'interactomeApp.Awsservice',
    'interactomeApp.Userservice',
    'interactomeApp.RecommendationService',
    'ngRoute'
])

// Sets our AWS arn on config through Awsservice
.config(function(AwsServiceProvider) {
    AwsServiceProvider
        .setArn(
            'arn:aws:iam::005837367462:role/newRole');
})


// Sets up main route to main.html when page is first loaded. 
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