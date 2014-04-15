'use strict';
/**
  Represents a single abstract. This uses a list-group-item as the tag.


  Implementation details/reasons:
    To avoid having to call $compile, I use a somewhat convoluted template to use ng-show.
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
          likes: '=',
          dislikes: '='
      	},
		    controller: ['$scope', '$http', 'AwsService', 'UserService', function($scope, $http, AwsService, UserService) {
      		$scope.getS3Data = function() {
      			
      		};

          $scope.getNames = function() {
            var temp = ""
            AwsService.getBatchUser($scope.paper.Authors).then(function(names) {
              for(var i = 0; i < names.length; i++){
                temp += (names[i].FirstName + " " + names[i].LastName + ", ");
              }
               $scope.authorData = temp.slice(0, -2);
            });
          };

          $scope.likeClick = function() {
            if($scope.likeStatus != true) { // will be undefined on first click which is ok
              $scope.likeMsg = " Liked abstract recommendation. ID = " + $scope.paper.Id;
              AwsService.postMessageToSNS('arn:aws:sns:us-west-2:005837367462:abstracts_liked', $scope.paper.Id);
              $scope.likeStatus = true; // true == liked
              AwsService.updateDynamoPref($scope.paper.Id, $scope.likeStatus, UserService.currentUsername());
            }
          };

          $scope.dislikeClick = function() {
            if($scope.likeStatus != false) { // will be undefined on first click which is ok
              $scope.likeMsg = " Disliked abstract recommendation";
              AwsService.postMessageToSNS('arn:aws:sns:us-west-2:005837367462:abstracts_disliked', $scope.paper.Id);
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

    	}],
    	template: '<li class="list-group-item">' +
                  '<div>' +
                  '<div class="btn-group" data-toggle="buttons">' +
                    '<label class="btn btn-primary liked" ng-click="likeClick()">' +
                      '<input type="radio" name="likeBtn" > <span class="glyphicon glyphicon-thumbs-up"></span>' +
                    '</label>' +
                    '<label class="btn btn-primary disliked" ng-click="dislikeClick()">' +
                      '<input type="radio" name="dislikeBtn" > <span class="glyphicon glyphicon-thumbs-down"></span>' +
                    '</label>' +
                  '</div>' +
                  '<button type="button" class="btn btn-primary" name="viewBtn" ng-click="viewAbstract()">' +
                      '<span class="glyphicon glyphicon-search"></span>' +
                  '</button>' +
                  '<p>{{likeMsg}}</p>' +
        	        '<h4 class="list-group-item-heading" ng-bind-html="paper.Title"></h4>' +
            	    '<input type="checkbox" class="pull-right abstractChck" value="{{paper.Id}}">' +
                	'<p class="list-group-item-text"> {{authorData}} </p>' +
                  '</div>' +
              	'</li>',

      link: function ($scope, element, attrs) {
        $scope.getNames();

        // Changed scope variable to $scope to allow me to access likes and dislikes

        for(var i = 0; i < $scope.likes.length; i++){
          if($scope.likes[i] == $scope.paper.Id)
            element.find('.liked').addClass("active");
        }

        for(var i = 0; i < $scope.dislikes.length; i++){
          if($scope.dislikes[i] == $scope.paper.Id)
            element.find('.disliked').addClass("active");
        }
     
      }
    };
  });
