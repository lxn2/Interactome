'use strict';
/**
    This is the main controller of the application. This controller should have logic for the main (always running?) parts of the website.
**/
angular.module('interactomeApp')
    .controller('MainCtrl', function($scope,$rootScope, UserService, AwsService) {
        $scope.abstractTargets = [];
        $scope.absRecd = null;
        // This function sets the user authentication from googleSignin directive. 
        $scope.signedIn = function(oauth) {
            // Google authentication passed into userService to hold onto and track user.
            UserService.setCurrentUser(oauth)
                .then(function(user) {
                    $scope.user = user;
                });
        };

        // Determines what happens after one or more abstract is selected
        $scope.abstractsRec = function()
        {
            var abstractsChecked = ''
            var absCount = 0;
            var abstracts = []
            $("input:checked").each(function() {
                abstractsChecked += $(this).val() + ",";
                $(this).click(); // uncheck it
                absCount++;
                abstracts.push($(this).val());
            });
            if (abstractsChecked != '') {
                abstractsChecked =  abstractsChecked.slice(0,-1)// Remove last comma
                //AwsService.postMessageToSNS('arn:aws:sns:us-west-2:005837367462:abstracts_req', abstractsChecked);
                $scope.absRecd = "Number of abstracts used to get recommendations: " + absCount; // this is just to show off functionality
                var recAbstracts = recMod(abstracts);
                console.log(recAbstracts);
                if (recAbstracts.length > 0) {
                    console.log("not null");
                    $scope.$apply(function () {
                        $scope.abstractTargets.push.apply($scope.abstractTargets, recAbstracts);
                    });
                }
            }
        };

        // Listen for broadcasts of s3 event
        var cleanupS3 = $rootScope.$on(AwsService.s3Broadcast, function() {
            var targets = AwsService.getLoadedS3Filenames();
            $scope.$apply(function () {
                $scope.abstractTargets.length = 0; //clears array without removing the array's refference (needed for binding)
                $scope.abstractTargets.push.apply($scope.abstractTargets, targets); // adding more than once requires an apply (not sure why)
            });
        });
        //Unsubscribe to S3 (from http://stackoverflow.com/questions/18856341/how-can-i-unregister-a-broadcast-event-to-rootscope-in-angularjs)
        $scope.$on("$destroy", function() {
            cleanupS3();
        });

    });