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
          localDeletePaper: '&deletePaper',
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
                $scope.localRenameTopic({topicId: $scope.itemId, topicName: $scope.editableValue}); // save in parent scope
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
            $scope.localDeleteTopic({topicId: scope.itemId});
            if($scope.scopePapersList.length > 1 || $scope.scopePapersList.length == 1 && $scope.scopePapersList[0] != $scope.placeHolder) { // contains saved papers

              var al = 'There are ' + $scope.scopePapersList.length + ' abstracts in "' + $scope.topicName +
              '". Deleting this topic will also delete the abstracts. Confirm deletion.';

              var confirmation = confirm(al);
              if (confirmation == true) {
                AwsService.deleteTopic($scope.itemId).then(function() { // delete in dynamo
                  scope.localDeleteTopic({topicId: scope.itemId}); // delete in parent scope
                }, function(reason) {
                  alert(reason);
                });
              }
            }
            else { // no papers
              AwsService.deleteTopic($scope.itemId).then(function() {// delete in dynamo
                scope.localDeleteTopic({topicId: scope.itemId}); // delete in parent scope
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
            
            for(var i = 0; i < curLength; i++) { // see if paper already exists
              if (scope.scopePapersList[i] == paperid) {
                exists = true;
                break;
              }
            }
            if(!exists) { // found paper
              AwsService.saveTopicPaper($scope.itemId, paperid).then(function() { // call to dynamo
                scope.localAddPaper({topicId: scope.itemId, paperId: paperid}); // update parent scope
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
            AwsService.deleteTopicPaper($scope.itemId, paperid).then(function() { // call to dynamo
              scope.localDeletePaper({topicId: scope.itemId, paperId: paperid}); // update in parent scope
              scope.scopePapersList.splice(index, 1);
              var curLength = scope.scopePapersList.length;
              if(curLength == 0) { // this was the only saved paper
                scope.noAbstracts = true;
              }
            }, function(reason) {
              alert(reason);
            });
          }
          
    	}],
      templateUrl: 'scripts/directives/topicpanelitem.html',
      link: function (scope, element, attrs) {
        scope.topicName = attrs.topicName;
        scope.itemId = attrs.itemId;
        scope.scopePapersList = ((attrs.papersList).replace(/['"\[\]]/gi,'')).split(','); // removes quotations and brackets, converts string into array
        if(scope.scopePapersList.length == 1 && scope.scopePapersList[0] == "") { // inserts a message if no abstracts
          scope.scopePapersList = []; // first value is "", so empty the array
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
