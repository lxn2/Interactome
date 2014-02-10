'use strict';
// Google+ signin Directive of type attribute. 
// Note: must be signed out of your google account for button to work and log you in again.
// This code was sampled from http://www.ng-newsletter.com/posts/aws-js-sdk.html (see it for more info)
angular.module('interactomeApp')
    .directive('googleSignin', function() {
        return {
            restrict: 'A',
            template: '<span id="signinButton"></span>',
            replace: true,
            scope: {
                afterSignin: '&'
            },
            link: function(scope, ele, attrs) {
                // Set standard google class
                attrs.$set('class', 'g-signin');
                // Set the clientid
                attrs.$set('data-clientid',
                    attrs.clientId + '.apps.googleusercontent.com');

                // build scope urls
                var scopes = attrs.scopes || [
                    'auth/plus.login',
                    'auth/userinfo.email'
                ];

                // build mulitple scopes if multiple users, I know its single user,
                // but it was easy to day and was worried about conflicts on same server. 
                var scopeUrls = [];
                for (var i = 0; i < scopes.length; i++) {
                    scopeUrls.push('https://www.googleapis.com/' + scopes[i]);
                };

                // Create a custom callback method, this allows us to fake the callback so when user signs in, 
                // we can redirect user to our afterSignin function, which is taken care of in main.js controller. 
                // This allows extensibility, so if a user signs in we can easily reroute the user to a new page "afterSignin"
                // and clear authentication proccess. 
                var callbackId = '_googleSigninCallback';
                var directiveScope = scope;
                window[callbackId] = function() {
                    var oauth = arguments[0];
                    directiveScope.afterSignin({
                        oauth: oauth

                    });

                    window[callbackId] = null;

                };

                // Set standard google signin button settings
                attrs.$set('data-callback', callbackId);
                attrs.$set('data-cookiepolicy', 'single_host_origin');
                attrs.$set('data-requestvisibleactions', 'http://schemas.google.com/AddActivity')
                attrs.$set('data-scope', scopeUrls.join(' '));

                // Finally, reload the client library to 
                // force the button to be painted in the browser
                (function() {
                    var po = document.createElement('script');
                    po.type = 'text/javascript';
                    po.async = true;
                    po.src = 'https://apis.google.com/js/client:plusone.js';
                    var s = document.getElementsByTagName('script')[0];
                    s.parentNode.insertBefore(po, s);
                })();
            }
        }
    });