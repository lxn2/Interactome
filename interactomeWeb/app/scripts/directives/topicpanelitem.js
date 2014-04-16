'use strict';

/**
  Lists collapsible panels of user topics
**/

angular.module('interactomeApp')
  .directive('topicPanelItem', function () {
    return {	
      	restrict: 'E',
      	scope: {      	
          localDeleteTopic: '&deleteTopic',
      		topicName: '@',
          itemId: '@',
          papersList: '@'
      	},

		    controller: ['$scope', 'AwsService', function($scope, AwsService) {          
          $scope.scopePapersList = [];
          $scope.editorEnabled = false;

          var inputTemplate = '<form>' +
                                '<input type="text" placeholder="New topic name..." name="text" />' +
                                '<input type="submit" id="submit" value="Add" />' +
                              '</form>';
          var defaultTemplate = 
                '<div class="accordion-group topic-accordion-size">' + 
                  '<div class="accordion-heading accordion-toggle" ng-click="isOpen = !isOpen">' +
                    '<div class="btn-group btn-group-xs">' +
                      '<button type="button" class="btn btn-default dropdown-toggle topic-dropdown-btn" data-toggle="dropdown">' +
                        '<span class="caret"></span>' +
                      '</button>' +
                      '<ul class="dropdown-menu">' +
                        '<li ng-click="getTemplate()">Rename</li>' +
                        '<li ng-click="deleteTopic()">Delete</li>' +
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
                '</div>';

          $scope.deleteTopic = function() {
            console.log('in topic del topic', $scope.scopePapersList[0]);
            if($scope.scopePapersList.length > 1 || $scope.scopePapersList.length == 1 && $scope.scopePapersList[0] != "No abstracts added") { // contains saved papers

              var al = 'There are ' + $scope.scopePapersList.length + ' abstracts in "' + $scope.topicName +
              '". Deleting this topic will also delete the abstracts. Confirm deletion.';

              var confirmation = confirm(al);
              if (confirmation == true) {
                var scope = $scope;
                AwsService.deleteTopic($scope.itemId).then(function() {
                  scope.localDeleteTopic({topicId: scope.itemId});
                }, function(reason) {
                  alert(reason);
                });
              }
            }
            else { // no papers
              AwsService.deleteTopic($scope.itemId);
            }
          };

          $scope.enableEdit = function() {
            $scope.editorEnabled = true;
            //$scope.view.editableValue = $scope.value;
          };

          $scope.disableEdit = function() {
            $scope.editorEnabled = false;
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
                          '<li ng-click="deleteTopic()">Delete</li>' +
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
                        '<input ng-model="topicName">' +
                        '<a ng-click="disableEdit()">cancel</a>' +
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

/*
'{{topicName}}' +
                    '<div class="btn-group btn-group-xs">' +
                      '<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">' +
                        '<span class="caret"></span>' +
                      '</button>' +
                      '<ul class="dropdown-menu">' +
                        '<li><a href="#">Dropdown link</a></li>' +
                        '<li><a href="#">Dropdown link</a></li>' +
                      '</ul>' +
                    '</div>' +
                    */