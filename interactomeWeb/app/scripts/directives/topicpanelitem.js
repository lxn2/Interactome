'use strict';

/**
  Lists collapsible panels of user topics
**/

angular.module('interactomeApp')
  .directive('topicPanelItem', function () {
    return {	
      	restrict: 'E',
        replace: true,
      	scope: { 
          localCheckTopic: '&checkTopic',
          localRenameTopic: '&renameTopic',
          localDeleteTopic: '&delete',
          localAddPaper: '&addPaper',
      		topicName: '@',
          itemId: '@',
          papersList: '@'
      	},

		    controller: ['$scope', 'AwsService', function($scope, AwsService) {          
          $scope.scopePapersList = [];
          $scope.editorEnabled = false;
          $scope.noAbstracts = null;
          $scope.editableValue = $scope.topicName;          
          $scope.placeHolder = 'No abstracts added';

          $scope.enableEdit = function() {
            $scope.editorEnabled = true;
          };

          $scope.disableEdit = function() {
            $scope.editableValue = $scope.topicName;
            $scope.editorEnabled = false;
          };

          // save a topic's new name
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

          // delete a topic
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
          };

          // adding paper to topic
          $scope.addPaper = function(paperid) {
            var scope = $scope;
            var exists = false;

            var curLength = scope.scopePapersList.length;
            
            for(var i = 0; i < curLength; i++) {
              if (scope.scopePapersList[i] == paperid) {
                exists = true;
                break;
              }
            }
            if(!exists) {
              AwsService.saveTopicPaper($scope.itemId, paperid).then(function() {
                if(curLength == 0) {
                  scope.scopePapersList = [paperid];
                }
                else {
                  scope.scopePapersList.push(paperid);
                }
              }, function(reason) {
                alert(reason);
              });
            }

            $scope.noAbstracts = false;
            $scope.$apply();
          };

          // delete a paper from a topic
          $scope.deletePaper = function(paperid, index) {
            var scope = $scope;
            AwsService.deleteTopicPaper($scope.itemId, paperid).then(function() {
              scope.scopePapersList.splice(index, 1);
              var curLength = scope.scopePapersList.length;
              if(curLength == 0) { // this is the only saved paper
                scope.noAbstracts = true;
              }
            }, function(reason) {
              alert(reason);
            });
          };
    	}],
      templateUrl: 'scripts/directives/topicpanelitem.html'
    	/*template: '<div class="accordion-group topic-accordion-size">' + 
                  '<div ng-hide="editorEnabled">' +
                    '<div class="accordion-heading accordion-toggle" ng-click="isOpen = !isOpen">' +
                      '<div class="btn-group btn-group-xs">' +
                        '<button type="button" class="btn btn-default dropdown-toggle topic-dropdown-btn" data-toggle="dropdown">' +
                          '<span class="glyphicon glyphicon-th-list"></span>' +
                        '</button>' +
                        '<ul class="dropdown-menu">' +
                          '<li ng-click="enableEdit()">Rename</li>' +
                          '<li ng-click="delete()">Delete</li>' +
                        '</ul>' +
                      '</div>' +
                      '{{topicName}}' +
                    '</div>' +
                    '<div class="accordion-body" collapse="!isOpen" ng-class="{smallScrollDiv:isOpen}">' +
                      '<div ng-hide="noAbstracts" class="accordion-inner">' +
                        '<li ng-repeat="paper in scopePapersList track by $index">' + // track by $index solves ng-repeat duplicate error: http://stackoverflow.com/questions/16296670/angular-ng-repeat-error-duplicates-in-a-repeater-are-not-allowed
                          '{{paper}}' +
                          '<button type="button" class="close" aria-hidden="true" alt="delete" title="delete" ng-click="deletePaper(paper, $index)">&times;</button>' +
                        '</li>' +
                      '</div>' +
                      '<div ng-show="noAbstracts" class="accordion-inner">' +
                        '{{placeHolder}}' +
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
                '</div>'*/
      ,
      link: function (scope, element, attrs) {
        scope.topicName = attrs.topicName;
        scope.itemId = attrs.itemId;
        scope.scopePapersList = ((attrs.papersList).replace(/['"\[\]]/gi,'')).split(','); // removes quotations and brackets, converts string into array
        if(scope.scopePapersList.length == 1 && scope.scopePapersList[0] == "") { // inserts a message if no abstracts
          scope.scopePapersList = []; 
          scope.noAbstracts = true;
        }
        else {
          scope.scopePapersList.sort();
          scope.noAbstracts = false;
        }

        element.droppable(
        {
          drop: function(event, ui) {
            scope.addPaper($(ui.draggable).data("abId"));
          },
          hoverClass: "ui-state-highlight", 

        });// http://codepen.io/m-e-conroy/pen/gwbqG shows that all I really had to add was replace!
      }
    };
  }); 
