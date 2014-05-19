'use strict';

angular.module('interactomeApp')
  .directive('collapsableAbstractTitles', function () {
    return {
      templateUrl: 'scripts/directives/collapsableabstracttitles.html',
      restrict: 'E',
      scope: {
        papers: '='
      },
      controller: ['$scope', function($scope) {
        $scope.isCollapsed = true;
        $scope.showMsg = "Show More";
        
        // Because papers is blank until stuff. may change in final version -- nathan
        $scope.$watch('papers', function() {
            var paperCount = $scope.papers.length;
            if(paperCount > 0) {
              $scope.heading = (paperCount > 1)? "Recommended abstracts based on the " + paperCount + " abstracts below" : "Recommended Abstracts based on";
              $scope.firstPaper = $scope.papers[0];
            } else {
              $scope.heading = "Suggested Abstracts by Us";
            }
        });
        
        $scope.showClick = function(){
          $scope.isCollapsed = !$scope.isCollapsed;
          $scope.showMsg = ($scope.isCollapsed)? "Show More" : "Show Less";
        };

      }],
      link: function($scope, element, attrs) {
        
      }
    };
  });
