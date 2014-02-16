'use strict';

angular.module('interactomeApp')
    .controller('MainCtrl', function($scope, UserService, AwsService) {
        //$scope.AwsService = AwsService;
        $scope.abstractTargets = [];
        //$scope.user = null;
        // This function sets the user authentication from googleSignin directive. 
        $scope.signedIn = function(oauth) {
            // Google authentication passed into userService to hold onto and track user.
            UserService.setCurrentUser(oauth)
                .then(function(user) {
                    $scope.user = user;
                });
        }

        AwsService.subscribeToS3(function (targets) {
            $scope.$apply(function () {
                console.log("tarrrrg" + targets);
                angular.forEach(targets, function(target){
                    $scope.abstractTargets.push(target);
                })
                
            });
        });



    });