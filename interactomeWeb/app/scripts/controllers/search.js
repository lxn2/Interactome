'use strict';

angular.module('interactomeApp')
  .controller('SearchCtrl', function($scope, $location, SearchService) {
    $scope.query = ($location.search()).search;
    SearchService.getResults($scope.query).then(function(data){
        $scope.results = data;
        console.log($scope.results);
    });

    console.log($scope.query);
    //$scope.results = {};
    
    //Setup a request to solr via EC2. I grabbed this code from 
    //http://www.opensourceconnections.com/2013/08/11/creating-a-search-html-element-with-angularjs/
    
    /*$.ajax({
        url: "http://ec2-54-201-190-162.us-west-2.compute.amazonaws.com:8983/solr/select",
        data: {
            "q": $scope.query,
            "qt": "edismax",
            "qf": "title text",
            "hl": true,
            "wt": "json",
            "rows":1000
        },
        traditional: true,
        cache: true,
        async: true,
        dataType: 'jsonp',
        jsonp: 'json.wrf',
        success: function (data) {
            //and when we get the query back we 
            //stick the results in the scope
            $scope.$apply(function () {
                $scope.results = data.response.docs;
            });
        }
    });*/

});
  