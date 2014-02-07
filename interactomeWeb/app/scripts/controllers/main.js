'use strict';

angular.module('interactomeApp')
    .controller('MainCtrl', function($scope) {

        $scope.signedIn = function(oauth) {
            UserService.setCurrentUser(oauth)
                .then(function(user) {
                    $scope.user = user;
                });
        }
        // Came with bower build
        $scope.awesomeThings = [
            'HTML5 Boilerplate',
            'AngularJS',
            'Karma'
        ];
    });