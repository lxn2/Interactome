'use strict';

angular.module('interactomeApp')
  .directive('collapsableAbstractTitles', function () {
    return {
      templateUrl: 'scripts/directives/collapsableabstracttitles.html',
      restrict: 'E',
      scope: {
        heading: '@',
        papers: '='
      },
      controller: ['$scope', function($scope) {
        $scope.isCollapsed = true;
        console.log($scope.papers);
        $scope.$watch('papers', function() {
            $scope.firstPaper = $scope.papers.shift();
        });
        
      }],
      link: function($scope, element, attrs) {
        
      }
    };
  });
