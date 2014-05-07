'use strict';
/**
  Represents a single abstract. This uses a list-group-item as the tag.


  Implementation details/reasons:
    Added a bidirectional bind on paper so we can pass the object. Avoids using $eval and $compile.
      Without this we would have to $eval it into an object and $compile to refresh the ng-click.
**/

angular.module('interactomeApp')
  .directive('abstractListGroupItem', function () {
    return {	
      	restrict: 'E',
      	scope: {      	
          localOnView: '&onView',
          paper: '=',
          likeStatus: '=',
          selectedAbstracts: '='
      	},
		    controller: ['$scope', '$http', 'AwsService', 'UserService', function($scope, $http, AwsService, UserService) {
          $scope.selected = false;

          $scope.getNames = function() {
            var temp = "";
            AwsService.getBatchUser($scope.paper.Authors).then(function(names) {
              // Ensure the correct order by adding one at a time to the string to display
              // Authors will be in order and we can't trust AWS to give us the correct order.
              for(var j = 0; j < $scope.paper.Authors.length; j++) {
                for(var i = 0; i < names.length; i++) {
                  if ($scope.paper.Authors[j] == names[i].Id)
                    temp += (names[i].FirstName + " " + names[i].LastName + ", ");
                }
              }
              $scope.authorData = temp.slice(0, -2);
            });
          };

          $scope.likeClick = function() {
            if($scope.likeStatus != true) { // will be undefined on first click which is ok
              //AwsService.postMessageToSNS('arn:aws:sns:us-west-2:005837367462:abstracts_liked', $scope.paper.Id);
              $scope.likeStatus = true; // true == liked
              AwsService.updateDynamoPref($scope.paper.Id, $scope.likeStatus, UserService.currentUsername());
            }
          };

          $scope.dislikeClick = function() {
            if($scope.likeStatus != false) { // will be undefined on first click which is ok
              //AwsService.postMessageToSNS('arn:aws:sns:us-west-2:005837367462:abstracts_disliked', $scope.paper.Id);
              $scope.likeStatus = false; // false == disliked
              AwsService.updateDynamoPref($scope.paper.Id, $scope.likeStatus, UserService.currentUsername());
            }
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
          $scope.$watch('selected', function() {
          if($scope.selected)
            $scope.selectedAbstracts.push($scope.paper.Id);
          else {
            var index = $scope.selectedAbstracts.indexOf($scope.paper.Id);
            if (index > -1)
              $scope.selectedAbstracts.splice(index, 1);
          }
        }, true);
    	}],
    	templateUrl: 'scripts/directives/abstractlistgroupitem.html',

      link: function ($scope, element, attrs) {
        $scope.getNames();
        element.draggable({
          revert: true, 
          appendTo: 'body', 
          zIndex: 5000, 
          cursor: "move",
          helper: function() {
            return $("<div class='abstractDrag list-group-item'><span class='badge'>dragging</span>" + $scope.paper.Title.substring(0, 40) + "...</div>");
          }
        }).data("abId", $scope.paper.Id);
      }
    };
  });
