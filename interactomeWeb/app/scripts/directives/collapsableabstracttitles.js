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
        
        // Watch papers because it will change when the user gets recs.
        $scope.$watch('papers', function() {
            var paperCount = $scope.papers.length;
            $scope.buttonBeingShown = (paperCount > 3);
            
            if(paperCount > 0)
              $scope.heading = (paperCount > 1)? "Recommended abstracts based on the " + paperCount + " abstracts below" : "Recommended Abstracts based on";
            else
              $scope.heading = "Suggested Abstracts by Us";
        });
        
        $scope.showClick = function(){
          $scope.isCollapsed = !$scope.isCollapsed;
          $scope.showMsg = ($scope.isCollapsed)? "Show More" : "Show Less";
        };

      }]
    };
  });
