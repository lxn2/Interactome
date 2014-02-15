'use strict';

angular.module('interactomeApp')
    .controller('MainCtrl', function($scope, UserService, AwsService, SearchService) {

        // This function sets the user authentication from googleSignin directive. 
        $scope.signedIn = function(oauth) {
            // Google authentication passed into userService to hold onto and track user.
            UserService.setCurrentUser(oauth)
                .then(function(user) {
                    $scope.user = user;
                    console.log(oauth);
                });
        }
        $scope.searchAuthorClick = function() {

            $scope.showSearch = true;
            $scope.dbStatus = SearchService.showResults();

        }
    });