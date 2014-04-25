'use strict';

angular.module('interactomeApp')
  .controller('SearchCtrl', function($scope, $location, SearchService) {
    var institution = ($location.search()).search;
    $scope.institutions = [];
    // once promise is made, then set the scope 
    SearchService.showResults(institution).then(function(userData) {
        $scope.institutions.push.apply($scope.institutions, userData);
    });

});
  