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

		    controller: ['$scope', '$http', 'AwsService', function($scope, $http, AwsService) {    
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
            $scope.localDeleteTopic({topicId: scope.topic.Id});
            if($scope.topic.PapersList.length > 1 || $scope.topic.PapersList.length == 1 && $scope.topic.PapersList[0] != $scope.placeHolder) { // contains saved papers

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
              if (scope.topic.PapersList[i] == paperid) {
                exists = true;
                break;
              }
            }
            if(!exists) { // found paper
              AwsService.saveTopicPaper($scope.topic.Id, paperid).then(function() { // call to dynamo
                if(curLength == 0) {
                  scope.topic.PapersList = [paperid];
                }
                else {
                  scope.topic.PapersList.push(paperid);
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
            AwsService.deleteTopicPaper($scope.topic.Id, paperid).then(function() { // call to dynamo
              scope.topic.PapersList.splice(index, 1);
              var curLength = scope.topic.PapersList.length;
              if(curLength == 0) { // this was the only saved paper
                scope.noAbstracts = true;
              }
            }, function(reason) {
              alert(reason);
            });
          };

          $scope.viewAbstract = function() {
            // Only grabs from s3 once
            if ($scope.s3Data === undefined) {
              $http.get($scope.paper.Link).success(function(data) {
                $scope.s3Data = data;

                $scope.localOnView({
                abTitle: $scope.s3Data.AbstractTitle,
                abAuthor: $scope.authorData,
                abText: $scope.s3Data.Abstract});

              }).error(function() {
                $scope.localOnView({ abTitle: "ERROR", abText: "Could not find abstract."});
              })

            } else {
              $scope.localOnView({
                abTitle: $scope.s3Data.AbstractTitle,
                abAuthor: $scope.authorData,
                abText: $scope.s3Data.Abstract});
            }
          };

          $scope.getRecs = function() {
            $scope.localGetRecs({paperslist: $scope.topic.PapersList}); // WE'RE NOT PASSING IN THE SAME ARRAY HERE...NOT UPDATING AFTER THE ADD
          };

          $scope.getPapers = function() {
//console.log('getting all paper info for', topics[i]);
            console.log('called getPapers, getting papers info for', $scope.topic.Id);
            if('PapersList' in $scope.topic) {
                //var curTopic = topics[i];
                var scope = $scope;
                AwsService.getBatchPaper(scope.topic.PapersList).then(function(papers) { // get the attributes
                    //curTopic.PapersList.length = 0;
                    scope.topic.PapersList = papers;
                    for(var m = 0; m < scope.topic.PapersList.length; m++) {
                      console.log(scope.topic);
                      var curPaper = scope.topic.PapersList[m];
                      AwsService.getBatchUser(scope.topic.PapersList[m].Authors).then(function(names) {
                        var temp = "";
                        // Ensure the correct order by adding one at a time to the string to display
                        // Authors will be in order and we can't trust AWS to give us the correct order.
                        for(var j = 0; j < curPaper.Authors.length; j++) {
                          for(var i = 0; i < names.length; i++) {
                            if (curPaper.Authors[j] == names[i].Id)
                              temp += (names[i].FirstName + " " + names[i].LastName + ", ");
                          }
                        }
                        curPaper.Authors = temp.slice(0, -2);
                      });
                    }
                    //console.log(scope.topic.PapersList);
                    //$scope.userTopics.push.apply($scope.userTopics, curTopic);
                }, function(reason) { // if we can't get them,
                    //delete topics[i].PapersList; // TEST THIS. Also we don't want this because
                    //
                    alert(reason);
                });   
            }
          };
    	}],
      templateUrl: 'scripts/directives/topicpanelitem.html',
      link: function (scope, element, attrs) {
        if('PapersList' in scope.topic) {
          scope.topic.PapersList.sort();
          //scope.papersList = scope.topic.PapersList;
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

        scope.getPapers();

      }
    };
  }); 
