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
          localOnView: '&onView',
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
            var listNewPapers;

            var curLength = scope.topic.PapersList.length;
            
            for(var i = 0; i < curLength; i++) { // see if paper already exists
              if (scope.topic.PapersList[i].Id == paperid) {
                exists = true;
                break;
              }
            }
            if(!exists) { // found paper
              AwsService.saveTopicPaper($scope.topic.Id, paperid).then(function() { // call to dynamo
                AwsService.getBatchPaper([paperid]).then(function(papers) { // this gets attributes
                  console.log(papers);
                  AwsService.getBatchUser(papers[0].Authors).then(function(names) {
                    var temp = "";
                    // Ensure the correct order by adding one at a time to the string to display
                    // Authors will be in order and we can't trust AWS to give us the correct order.
                    for(var j = 0; j < papers[0].Authors.length; j++) {
                      for(var i = 0; i < names.length; i++) {
                        if (papers[0].Authors[j] == names[i].Id)
                          temp += (names[i].FirstName + " " + names[i].LastName + ", ");
                      }
                    }
                    papers[0].Authors = temp.slice(0, -2);

                    listNewPapers = papers;
                    if(curLength == 0) {
                      scope.topic.PapersList = listNewPapers;
                    }
                    else {
                      scope.topic.PapersList.push(listNewPapers[0]);
                    }
                  }, function(reason) {
                    alert(reason);
                  });

                }, function(reason) {
                  alert(reason);
                });

              }, function(reason) {
                alert(reason);
              });
            }

            $scope.noAbstracts = false;
            $scope.$apply();
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

          $scope.viewAbstract = function(paper, index) {
            // Only grabs from s3 once
            if (paper.s3Data === undefined) {
              $http.get(paper.Link).success(function(data) {
                paper.s3Data = data;
                console.log('got s3 paper');
                AwsService.getBatchUser(paper.Authors).then(function(names) {
                  var temp = "";
                  console.log(names);
                  // Ensure the correct order by adding one at a time to the string to display
                  // Authors will be in order and we can't trust AWS to give us the correct order.
                  for(var j = 0; j < paper.Authors.length; j++) {
                    for(var i = 0; i < names.length; i++) {
                      if (paper.Authors[j] == names[i].Id)
                        temp += (names[i].FirstName + " " + names[i].LastName + ", ");
                    }
                  }
                  console.log('temp', temp);
                  paper.Authors = temp.slice(0, -2);

                  $scope.localOnView({
                  abTitle: paper.Title,
                  abAuthor: paper.Authors,
                  abText: paper.s3Data.Abstract});

                }, function(reason) {
                  alert(reason);
                });

              }).error(function() {
                $scope.localOnView({ abTitle: "ERROR", abText: "Could not find abstract."});
              })

            } else {
              $scope.localOnView({
              abTitle: paper.Title,
              abAuthor: paper.Authors,
              abText: paper.s3Data.Abstract});
            }
          };

          $scope.getRecs = function() {
            $scope.localGetRecs({paperslist: $scope.topic.PapersList}); 
          };

          // replaces PapersList with a list of objects that has attributes for each paper
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
