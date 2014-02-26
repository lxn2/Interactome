'use strict';
/**
  Represents a single abstract. This uses a list-group-item as the tag.


  Implementation details/reasons:
    To avoid having to call $compile, I use a somewhat convoluted template to use ng-show.
**/

angular.module('interactomeApp')
  .directive('abstractListGroupItem', function () {
    return {	
      	restrict: 'E',
      	scope: {      	
          localOnView: '&onView',
      		abstractLink: '@'

      	},
		    controller: ['$scope', '$http', 'AwsService', function($scope, $http, AwsService) {
      		$scope.getS3Data = function() {
      			$http.get($scope.abstractLink).success(function(data){
      				$scope.s3Data = data;
              $scope.noError = true;
      			}).error(function() {
              $scope.noError = false;
            })
      		};

          $scope.likeClick = function() {
            if($scope.likeStatus != true) { // will be undefined on first click which is ok
              $scope.likeMsg = " Liked abstract recommendation. ID = " + $scope.abstractLink;
              AwsService.postMessageToSNS('arn:aws:sns:us-west-2:005837367462:abstracts_liked', $scope.abstractLink);
              $scope.likeStatus = true; // true == liked
              AwsService.updateDynamoPref($scope.abstractLink, $scope.likeStatus);

            }
          };

          $scope.dislikeClick = function() {
            if($scope.likeStatus != false) { // will be undefined on first click which is ok
              $scope.likeMsg = " Disliked abstract recommendation";
              AwsService.postMessageToSNS('arn:aws:sns:us-west-2:005837367462:abstracts_disliked', $scope.abstractLink);
              $scope.likeStatus = false; // false == disliked
              AwsService.updateDynamoPref($scope.abstractLink, $scope.likeStatus);

            }
          };

          $scope.viewAbstract = function() {
            $scope.localOnView({abTitle: $scope.s3Data.AbstractTitle,abFirst: $scope.s3Data.FirstName[0],abLast: $scope.s3Data.LastName,abText: $scope.s3Data.Abstract});
            $('#abstractViewModal').modal('show'); // open modal
          };

    	}],
    	template: '<li class="list-group-item">' +
                  '<h4 class="list-group-item-heading" ng-show="!noError"> ERROR. Could not find abstract. </h4>' +
                  '<div ng-show="noError">' +
                  '<div class="btn-group" data-toggle="buttons">' +
                    '<label class="btn btn-primary" ng-click="likeClick()">' +
                      '<input type="radio" name="likeBtn" > <span class="glyphicon glyphicon-thumbs-up"></span>' +
                    '</label>' +
                    '<label class="btn btn-primary" ng-click="dislikeClick()">' +
                      '<input type="radio" name="likeBtn" > <span class="glyphicon glyphicon-thumbs-down"></span>' +
                    '</label>' +
                  '</div>' +
                  '<button type="button" class="btn btn-primary" name="viewBtn" ng-click="viewAbstract()">' +
                      '<span class="glyphicon glyphicon-search"></span>' +
                  '</button>' +
                  '<p>{{likeMsg}}</p>' +
        	        '<h4 class="list-group-item-heading"> {{s3Data.AbstractTitle}} </h4>' +
            	    '<input type="checkbox" class="pull-right abstractChck" value="{{abstractLink}}">' +
                	'<p class="list-group-item-text"> Author: {{s3Data.FirstName[0] + ". " + s3Data.LastName}} </p>' +
                  '</div>' +
              	'</li>',
      link: function (scope, element, attrs) {
      	scope.abstractLink = attrs.abstractLink;
        scope.getS3Data();
      }
    };
  });
