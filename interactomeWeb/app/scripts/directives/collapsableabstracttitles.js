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
        $scope.showMsg = "Show More";
        
        // Because papers is blank until stuff. may change in final version -- nathan
        $scope.$watch('papers', function() {
            $scope.firstPaper = $scope.papers[0];
        });
        
        $scope.showClick = function(){
          $scope.isCollapsed = !$scope.isCollapsed;
          $scope.showMsg = ($scope.isCollapsed)? "Show More" : "Show Less";
        }

      }],
      link: function($scope, element, attrs) {
        
      }
    };
  });
