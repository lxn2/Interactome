'use strict';
/**
    This is the main controller of the application. This controller should have logic for the main (always running?) 
    parts of the website.
**/
var app = angular.module('interactomeApp');

app.controller('MainCtrl', function($scope, UserService, AwsService, RecommendationService) {
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

    

    $scope.paginate = function() {
        // Setting currentPage to 0 is a hack to get the recs working on page 1.
        if ($scope.currentPage == 0)
            $scope.currentPage = 1;
        var begin = (($scope.currentPage - 1) * $scope.numPerPage);
        var end = begin + $scope.numPerPage;
        $scope.filteredPapers = $scope.papers.slice(begin, end);
    };
    $scope.$watch('currentPage', $scope.paginate);
    $scope.$watch('numPerPage', $scope.paginate);

    // Determines what happens after one or more abstract is selected
    $scope.abstractsRec = function() {
        if ($scope.selectedAbstracts.length > 0) {
            //var abstractsChecked = $scope.selectedAbstracts.join();
            //AwsService.postMessageToSNS('arn:aws:sns:us-west-2:005837367462:abstracts_req', abstractsChecked);
            RecommendationService.getRecs($scope.selectedAbstracts).then(function(paperList) {
                $scope.selectedAbstracts.length = 0;
                $scope.papers.length = 0;
                $scope.papers.push.apply($scope.papers, paperList);
                //Pagination
                $scope.currentPage = 0;
                $scope.paginationTotalItems = $scope.papers.length;
                $scope.moreThanOnePage = ($scope.numPerPage < $scope.paginationTotalItems);
            });
        }
    };

    // updates abstract information for modal view
    $scope.showAbstract = function(abTitle, abAuthor, abText) {
        $scope.modalTitle = abTitle;
        $scope.modalAuthor = abAuthor;
        $scope.modalText = abText;
        $('#abstractViewModal').modal('show'); // open modal
    }

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
