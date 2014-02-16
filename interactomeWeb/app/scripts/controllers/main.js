'use strict';
/**
    This is the main controller of the application. This controller should have logic for the main (always running?) parts of the website.
**/
angular.module('interactomeApp')
    .controller('MainCtrl', function($scope,$rootScope, UserService, AwsService) {
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
        };

        // Determines what happens after one or more abstract is selected
        $scope.abstractsReq = function()
        {
            var chkId = ''
            $("input:checked").each(function() {
                chkId += $(this).val() + ",";
            });
            if (chkId != '') {
                chkId =  chkId.slice(0,-1)// Remove last comma
                console.log(chkId);
                AwsService.postMessageToSNS('arn:aws:sns:us-west-2:005837367462:abstracts_req', chkId);
            }
        };


        // Refactor Warning: This will eventually be refactored to whatever the rec system does.
        // AwsService.subscribeToS3(function (targets) {
        //     $scope.$apply(function () {
        //         $scope.abstractTargets.length = 0; //clears array
        //         $scope.abstractTargets.push.apply($scope.abstractTargets, targets); // adding more than once requires an apply (not sure why)
        //     });
        // });

        $rootScope.$on('s3Abstracts@AwsService', function() {
            var targets = AwsService.test();
            $scope.$apply(function () {
                $scope.abstractTargets.length = 0; //clears array
                $scope.abstractTargets.push.apply($scope.abstractTargets, targets); // adding more than once requires an apply (not sure why)
            });
        });
        // Unsubscribe to S3 (from http://stackoverflow.com/questions/18856341/how-can-i-unregister-a-broadcast-event-to-rootscope-in-angularjs)
        // $scope.$on("$destroy", function() {
        //     $scope.cleanupSub();
        // });

    });