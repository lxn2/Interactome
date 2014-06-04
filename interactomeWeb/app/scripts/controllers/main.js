'use strict';
/**
    This is the main controller of the application. This controller should have logic for the main (always running?) 
    parts of the website.
**/
var app = angular.module('interactomeApp');

app.controller('MainCtrl', function($rootScope, $scope, UserService, AwsService, RecommendationService) {
    $scope.papers = [];

    $scope.modalTitle = null;
    $scope.modalFirstName = null;
    $scope.modalLastName = null;
    $scope.modalText = null;

    $scope.paginationTotalItems = 0;
    $scope.moreThanOnePage = false;
    $scope.numPerPage = 10;
    $scope.currentPage = 1;
    $scope.maxSize = 5;
    $scope.filteredPapers = [];

    // Hash for like status, true == liked and false == disliked. Not in the hash means neither.
    $scope.paperLikeStatus = {};
    $scope.selectedAbstracts = [];

    $scope.recOriginAbstracts = []; // list of abstracts the current recs are seeded from

    $scope.paginate = function() {
        $('body').animate({scrollTop: 0});
        // Setting currentPage to 0 is a hack to get the recs working on page 1.
        if ($scope.currentPage == 0)
            $scope.currentPage = 1;
        var begin = (($scope.currentPage - 1) * $scope.numPerPage);
        var end = begin + $scope.numPerPage;
        $scope.filteredPapers = $scope.papers.slice(begin, end);
    };
    $scope.$watch('currentPage', $scope.paginate);
    $scope.$watch('numPerPage', $scope.paginate);
    $scope.$on('getRecsFromTopic', function(event, topicspaperslist) {
        $scope.abstractsRecFromTopic(topicspaperslist);
    });

    // Calls RecommendationService for recommendations based off of list of abstracts
    $scope.abstractsRec = function(paperslist) {
        if(paperslist.length > 0) {
            //var abstractsChecked = $scope.selectedAbstracts.join();
            //AwsService.postMessageToSNS('arn:aws:sns:us-west-2:005837367462:abstracts_req', abstractsChecked);
            RecommendationService.getRecs(paperslist).then(function(reclist) {
                var temp = paperslist.slice(0); // copy array for rec heading
                $scope.selectedAbstracts.length = 0;
                $scope.papers.length = 0;

                // Having the logic inside of the animate causes a nice fade in for the new abstracts.
                // Since we are using jquery, we must wrap it in an $apply for angular to know about it.
                // We use  jquery here to scroll because smooth scrolling in angular is messy.
                $('body').animate({scrollTop: 0}, 2000, function() { 
                    $scope.$apply(function() {
                        $scope.recOriginAbstracts = temp;//updates the text of the abstracttitles directive
                        $scope.gettingAbstractRecs=false;
                        $scope.papers.push.apply($scope.papers, reclist);

                        //Pagination
                        $scope.currentPage = 0;
                        $scope.paginationTotalItems = $scope.papers.length;
                        $scope.moreThanOnePage = ($scope.numPerPage < $scope.paginationTotalItems);
                    })
                });
            });
            // Triggers animation, will happen before .then happens (because of async)
            $scope.gettingAbstractRecs = true;
        }
    };

    // request for recommendations from selected abstracts
    $scope.abstractsRecFromSelected = function() {
        $scope.abstractsRec($scope.selectedAbstracts);
    };

    // request for recommendations from topics
    $scope.abstractsRecFromTopic = function(topicspaperslist) {
        $scope.abstractsRec(topicspaperslist);
    };

    // Controls get-recs cancel button behavior. Let's directives know to become unselected.
    $scope.cancelSelectedAbstracts = function() { 
        //$emit travels upwards so since we are using rootscope (directives have isolated scope)
        //it will not bubble to any other scopes.
        $rootScope.$emit('cancelSelectedAbstracts');
        $scope.selectedAbstracts.length = 0;
    };

    // Setup by using AWS credentials
    AwsService.credentials().then(function() {
        var uName = UserService.currentUsername();
        AwsService.getDynamoPref(uName).then(function(dbItem) {

            for(var i = 0; i < dbItem.Item.Likes.SS.length; i++) {
                $scope.paperLikeStatus[dbItem.Item.Likes.SS[i]] = true;
            }
            for(var i = 0; i < dbItem.Item.Dislikes.SS.length; i++) {
                $scope.paperLikeStatus[dbItem.Item.Dislikes.SS[i]] = false;
            }

            AwsService.getPapers(100).then(function(paperList) {
                $scope.papers.length = 0;
                $scope.papers.push.apply($scope.papers, paperList);
                $scope.currentPage = 0;
                $scope.paginationTotalItems = $scope.papers.length;
                $scope.moreThanOnePage = ($scope.numPerPage < $scope.paginationTotalItems);
            });
        });
        
    });
});
