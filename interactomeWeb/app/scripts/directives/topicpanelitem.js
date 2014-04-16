'use strict';

/**
  Lists collapsible panels of user topics
**/

angular.module('interactomeApp')
  .directive('topicPanelItem', function () {
    return {	
      	restrict: 'E',
      	scope: {      	
          localCheckTopic: '&checkTopic',
          localRenameTopic: '&renameTopic',
      		topicName: '@',
          itemId: '@',
          papersList: '@'
      	},

		    controller: ['$scope', 'AwsService', function($scope, AwsService) {          
          $scope.scopePapersList = [];
          $scope.editorEnabled = false;
          $scope.editableValue = $scope.topicName;

          $scope.enableEdit = function() {
            $scope.editorEnabled = true;
            //$scope.view.editableValue = $scope.value;
          };

          $scope.disableEdit = function() {
            $scope.editableValue = $scope.topicName;
            $scope.editorEnabled = false;
          };

          $scope.save = function() {
            if(!$scope.localCheckTopic({topicName: $scope.editableValue})) { // check if topicname already exists
              AwsService.renameTopic($scope.itemId, $scope.editableValue).then(function() { // updateItem
                $scope.topicName = $scope.editableValue; // change view
                $scope.localRenameTopic({topicId: $scope.itemId, topicName: $scope.editableValue});
                $scope.disableEdit();
              }, function(reason) {
                alert(reason);
              });
            }
            else {
              alert('Topic already exists');
            }
            
          };
    	}],
    	template: '<div class="accordion-group topic-accordion-size">' + 
                  '<div ng-hide="editorEnabled">' +
                    '<div class="accordion-heading accordion-toggle" ng-click="isOpen = !isOpen">' +
                      '<div class="btn-group btn-group-xs">' +
                        '<button type="button" class="btn btn-default dropdown-toggle topic-dropdown-btn" data-toggle="dropdown">' +
                          '<span class="caret"></span>' +
                        '</button>' +
                        '<ul class="dropdown-menu">' +
                          '<li ng-click="enableEdit()">Rename</li>' +
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
                  '</div>' +
                  '<div ng-show="editorEnabled">' +
                    '<div>' +
                        '<input ng-model="editableValue">' +
                        '<button ng-click="save()">save</button>' +
                        '<button ng-click="disableEdit()">cancel</button>' +
                    '</div>' +
                  '</div>' +
                '</div>'
      ,
      link: function (scope, element, attrs) {
        scope.topicName = attrs.topicName;
        scope.itemId = attrs.itemId;
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
