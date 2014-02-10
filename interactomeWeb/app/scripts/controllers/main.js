'use strict';

angular.module('interactomeApp')
<<<<<<< HEAD
    .controller('MainCtrl', function($scope, Awsservice, Userservice) {
=======
    .controller('MainCtrl', function($scope, UserService) {
>>>>>>> 016c8e5d4487484217ccdf80674846c1d0b84f14

        // This function sets the user authentication from googleSignin directive. 
        $scope.signedIn = function(oauth) {
            // Google authentication passed into userService to hold onto and track user.
            Userservice.setCurrentUser(oauth)
                .then(function(user) {
                    $scope.user = user;
                });
        }
    });