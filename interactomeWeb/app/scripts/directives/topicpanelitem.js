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
    	template: '<accordion>' +
                  '<accordion-group heading="{{topicName}}">' +
                      '<li ng-repeat="paper in scopePapersList track by $index">' + // track by $index solves ng-repeat duplicate error: http://stackoverflow.com/questions/16296670/angular-ng-repeat-error-duplicates-in-a-repeater-are-not-allowed
                        '{{paper}}' +
                      '</li>' +
                  '</accordion-group>' +
                '</accordian>',
      link: function (scope, element, attrs) {
        scope.topicName = attrs.topicName;
        scope.scopePapersList = ((attrs.papersList).replace(/['"\[\]]/gi,'')).split(','); // removes quotations and brackets, converts string into array
      }
    };
  });