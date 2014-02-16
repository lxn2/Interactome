'use strict';

angular.module('interactomeApp')
    .controller('MainCtrl', function($scope, UserService, AwsService) {
        //$scope.AwsService = AwsService;
        $scope.abstractTargets = AwsService.abstractURLIds;
        //$scope.user = null;
        // This function sets the user authentication from googleSignin directive. 
        $scope.signedIn = function(oauth) {
            // Google authentication passed into userService to hold onto and track user.
            UserService.setCurrentUser(oauth)
                .then(function(user) {
                    $scope.user = user;
                });
        }

        $scope.$watch('user', function (newVal, oldVal, scope) {
            console.log("happened");
            if(newVal && newVal !== oldVal) {
                 AwsService.getS3Targets().then(function(targets) {
                    scope.abstractTargets = tagets;
                    console.log("inside the fuck: " + scope.abstractTargets)
                });
                console.log("wtf: " + scope.abstractTargets)
            }
      });

    });