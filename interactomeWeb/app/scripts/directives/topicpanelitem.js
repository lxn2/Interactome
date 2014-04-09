'use strict';
/**
  Lists collapsible panels of user topics
**/

angular.module('interactomeApp')
  .directive('topicPanelItem', function () {
    return {	
      	restrict: 'E',
      	scope: {      	
      		topicName: '@',
          papersList: '@'
      	},
		    controller: ['$scope', 'AwsService', function($scope, AwsService) {          
          $scope.scopePapersList = [];
    	}],
    	template: '<div class="accordion-group topic-accordion-size">' + 
                  '<div class="accordion-heading accordion-toggle" ng-click="isOpen = !isOpen">' +
                    '{{topicName}}' +
                  '</div>' +
                  '<div class="accordion-body" collapse="!isOpen" ng-class="{smallScrollDiv:isOpen}">' +
                    '<div class="accordion-inner">' +
                      '<li ng-repeat="paper in scopePapersList track by $index">' + // track by $index solves ng-repeat duplicate error: http://stackoverflow.com/questions/16296670/angular-ng-repeat-error-duplicates-in-a-repeater-are-not-allowed
                        '{{paper}}' +
                      '</li>' +
                    '</div>' +
                  '</div>' +
                '</div>'
      ,
      link: function (scope, element, attrs) {
        scope.topicName = attrs.topicName;
        scope.scopePapersList = ((attrs.papersList).replace(/['"\[\]]/gi,'')).split(','); // removes quotations and brackets, converts string into array
        if(scope.scopePapersList.length == 1 && scope.scopePapersList[0] == "") { // inserts a message if no abstracts
          scope.scopePapersList = ["No abstracts added"];
        }
        else {
          scope.scopePapersList.sort();
        }
      }
    };
  });