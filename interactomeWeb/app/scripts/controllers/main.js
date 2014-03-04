'use strict';
/**
    This is the main controller of the application. This controller should have logic for the main (always running?) parts of the website.
**/
var app = angular.module('interactomeApp');

app.controller('MainCtrl', function($scope, $rootScope, UserService, AwsService, RecommendationService) {
    console.log("made conteoller");
    $scope.papers = [];

    $scope.absRecd = null;
    $scope.modalTitle = null;
    $scope.modalFirstName = null;
    $scope.modalLastName = null;
    $scope.modalText = null;

    // This function sets the user authentication from googleSignin directive. 
    $scope.signedIn = function(oauth) {
        // Google authentication passed into userService to hold onto and track user.
        UserService.setCurrentOAuthUser(oauth)
            .then(function(user) {
                $scope.user = user;
                $scope.username = UserService.currentUsername();
            });
    };

    // Determines what happens after one or more abstract is selected
    $scope.abstractsRec = function() {
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
            abstractsChecked = abstractsChecked.slice(0, -1) // Remove last comma
            //AwsService.postMessageToSNS('arn:aws:sns:us-west-2:005837367462:abstracts_req', abstractsChecked);
            $scope.absRecd = "Number of abstracts used to get recommendations: " + absCount; // this is just to show off functionality
            RecommendationService.getRecs(abstracts).then(function(paperList) {
                $scope.papers.length = 0;
                $scope.papers.push.apply($scope.papers, paperList);
            });
        }
    };

    $scope.showAbstract = function(abTitle, firstName, lastName, abText) {
        $scope.modalTitle = abTitle;
        $scope.modalFirstName = firstName;
        $scope.modalLastName = lastName;
        $scope.modalText = abText;
    }

    // Listen for broadcasts of a token changing (this means AWS resources are available)
    var cleanupToken = $rootScope.$on(AwsService.tokenSetBroadcast, function() {
        AwsService.getPapers(10).then(function(paperList) {
                $scope.papers.length = 0;
                $scope.papers.push.apply($scope.papers, paperList);
            });
    });

    //Unsubscribe (from http://stackoverflow.com/questions/18856341/how-can-i-unregister-a-broadcast-event-to-rootscope-in-angularjs)
    $scope.$on("$destroy", function() {
        cleanupToken();
    });

});

app.controller('SearchCtrl', function($scope, $rootScope, UserService, AwsService, SearchService) {

    var institution = $scope.searchByInstitution;
    $scope.institutions = [];

    // once promise is made, then set the scope 
    SearchService.showResults(institution).then(function(userData) {
        console.log(userData);
        $scope.institutions.push.apply($scope.institutions, userData);

    });

});