'use strict';
/**
  Lists collapsible panels of user topics
**/

angular.module('interactomeApp')
  .directive('topicPanelItem', function () {
    return {	
      	restrict: 'E',
      	scope: {      	
          localDeleteTopic: '&delete',
      		topicName: '@',
          itemId: '@',
          papersList: '@'
      	},
		    controller: ['$scope', 'AwsService', function($scope, AwsService) {          
          $scope.scopePapersList = [];
          $scope.placeHolder = 'No abstracts added';


          $scope.delete = function() {
            var scope = $scope;
            if($scope.scopePapersList.length > 1 || $scope.scopePapersList.length == 1 && $scope.scopePapersList[0] != $scope.placeHolder) { // contains saved papers

              var al = 'There are ' + $scope.scopePapersList.length + ' abstracts in "' + $scope.topicName +
              '". Deleting this topic will also delete the abstracts. Confirm deletion.';

              var confirmation = confirm(al);
              if (confirmation == true) {
                AwsService.deleteTopic($scope.itemId).then(function() {
                  scope.localDeleteTopic({topicId: scope.itemId});
                }, function(reason) {
                  alert(reason);
                });
              }
            }
            else { // no papers
              AwsService.deleteTopic($scope.itemId).then(function() {
                scope.localDeleteTopic({topicId: scope.itemId});
              }, function(reason) {
                alert(reason);
              });
            }
          }
    	}],
    	template: '<div class="accordion-group topic-accordion-size">' + 
                  '<div class="accordion-heading accordion-toggle" ng-click="isOpen = !isOpen">' +
                    '<div class="btn-group btn-group-xs">' +
                      '<button type="button" class="btn btn-default dropdown-toggle topic-dropdown-btn" data-toggle="dropdown">' +
                        '<span class="glyphicon glyphicon-th-list"></span>' +
                      '</button>' +
                      '<ul class="dropdown-menu">' +
                        '<li ng-click="delete()">Delete</li>' +
                      '</ul>' +
                    '</div>' +
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
        scope.itemId = attrs.itemId;
        scope.scopePapersList = ((attrs.papersList).replace(/['"\[\]]/gi,'')).split(','); // removes quotations and brackets, converts string into array
        if(scope.scopePapersList.length == 1 && scope.scopePapersList[0] == "") { // inserts a message if no abstracts
          scope.scopePapersList = [scope.placeHolder];
        }
        else {
          scope.scopePapersList.sort();
        }
      }
    };
  });