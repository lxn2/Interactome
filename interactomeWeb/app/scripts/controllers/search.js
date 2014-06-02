'use strict';

angular.module('interactomeApp')
  .controller('SearchCtrl', function($scope, $location, SearchService) {
    $scope.query = ($location.search()).search;
    SearchService.getResults($scope.query).then(function(data){
        $scope.response = data;
        $scope.results = $scope.response.response.docs;

    });

    console.log($scope.query);


});
  