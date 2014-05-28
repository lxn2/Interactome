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
          localGetRecs: '&getRecs',
      		topic: '='
      	},

		    controller: ['$rootScope', '$scope', '$http', 'AwsService', function($rootScope, $scope, $http, AwsService) {    
          $scope.editorEnabled = false;
          $scope.noAbstracts = null;
          $scope.editableValue = $scope.topic.Name;          
          $scope.placeHolder = 'No abstracts added';

          $scope.enableEdit = function() {
            $scope.editorEnabled = true;
          };

          $scope.disableEdit = function() {
            $scope.editableValue = $scope.topic.Name;
            $scope.editorEnabled = false;
          };

          // save a topic's new name
          $scope.save = function() {
            if(!$scope.localCheckTopic({topicName: $scope.editableValue})) { // check if topicname already exists
              AwsService.renameTopic($scope.topic.Id, $scope.editableValue).then(function() { // updateItem
                $scope.topic.Name = $scope.editableValue; // change view
                $scope.localRenameTopic({topicId: $scope.topic.Id, topicName: $scope.editableValue}); // save in parent scope
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
            if($scope.topic.PapersList.length > 0) { // contains saved papers

              var al = 'There are ' + $scope.topic.PapersList.length + ' abstracts in "' + scope.topic.Name +
              '". Deleting this topic will also delete the abstracts. Confirm deletion.';

              var confirmation = confirm(al);
              if (confirmation == true) {
                AwsService.deleteTopic($scope.topic.Id).then(function() { // delete in dynamo
                  scope.localDeleteTopic({topicId: scope.topic.Id}); // delete in parent scope
                }, function(reason) {
                  alert(reason);
                });
              }
            }
            else { // no papers
              AwsService.deleteTopic($scope.topic.Id).then(function() {// delete in dynamo
                scope.localDeleteTopic({topicId: scope.topic.Id}); // delete in parent scope
              }, function(reason) {
                alert(reason);
              });
            }
          };

          // adding paper to topic
          $scope.addPaper = function(paperid) {
            var scope = $scope;
            var exists = false;

            var curLength = scope.topic.PapersList.length;
            
            for(var i = 0; i < curLength; i++) { // see if paper already exists
              if(scope.topic.PapersList[i].Id == paperid) {
                exists = true;
                break;
              }
            }

            if(!exists) { // paper doesn't exist
              AwsService.saveTopicPaper($scope.topic.Id, paperid).then(function() { // call to dynamo
                AwsService.getBatchPaper([paperid]).then(function(papers) { // this gets attributes
                  if(curLength == 0) {
                    scope.topic.PapersList = papers; 
                  }
                  else {
                    scope.topic.PapersList.push(papers[0]); 
                  }

                  $scope.noAbstracts = false;
                }, function(reason) {
                  alert(reason);
                });

              }, function(reason) {
                alert(reason);
              });
            }

          };

          // delete a paper from a topic
          $scope.deletePaper = function(paper, index) {
            var scope = $scope;
            AwsService.deleteTopicPaper($scope.topic.Id, paper.Id).then(function() { // call to dynamo
              scope.topic.PapersList.splice(index, 1);
              var curLength = scope.topic.PapersList.length;
              if(curLength == 0) { // this was the only saved paper
                scope.noAbstracts = true;
              }
            }, function(reason) {
              alert(reason);
            });
          };

          $scope.viewAbstract = function(paper) {
            $rootScope.$emit('showModal', paper);
          };

          $scope.getRecs = function() {
            $scope.localGetRecs({paperslist: $scope.topic.PapersList}); 
          };

          // replaces PapersList with a list of objects that has attributes for each paper
          // should be called once from the link function
          $scope.getPapers = function() {
            if('PapersList' in $scope.topic) {
                var scope = $scope;
                AwsService.getBatchPaper(scope.topic.PapersList).then(function(papers) { // get the attributes
                    scope.topic.PapersList = papers;
                }, function(reason) {
                    alert(reason);
                });   
            }
          };

    	}],
      templateUrl: 'scripts/directives/topicpanelitem.html',
      link: function (scope, element, attrs) {
        if('PapersList' in scope.topic) {
          scope.topic.PapersList.sort();
          scope.getPapers();
          scope.noAbstracts = false;
        }
        else {
          scope.topic.PapersList = [];
          scope.noAbstracts = true;
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
