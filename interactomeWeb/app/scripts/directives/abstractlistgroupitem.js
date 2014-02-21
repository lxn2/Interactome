'use strict';
/**
  Represents a single abstract. This uses a list-group-item as the tag.
**/

angular.module('interactomeApp')
  .directive('abstractListGroupItem', function () {
  	var urlBase = "https://s3-us-west-2.amazonaws.com/sagebionetworks-interactome-abstracts/";
    return {	
      	restrict: 'E',
      	scope: {
      		abstractId: '@'
      	},
		    controller: ['$scope', '$http', 'AwsService', function($scope, $http, AwsService) {
      		$scope.getS3Data = function() {
      			$http.get(urlBase + $scope.abstractId).success(function(data){
      				$scope.s3Data = data;
      			})
      		};

          $scope.likeClick = function() {
            if($scope.likeStatus != true) { // will be undefined on first click which is ok
              $scope.likeMsg = " Liked abstract recommendation";
              AwsService.postMessageToSNS('arn:aws:sns:us-west-2:005837367462:abstracts_liked', $scope.abstractId);
              $scope.likeStatus = true; // true == liked
            }
          };

          $scope.dislikeClick = function() {
            if($scope.likeStatus != false) { // will be undefined on first click which is ok
              $scope.likeMsg = " Disliked abstract recommendation";
              AwsService.postMessageToSNS('arn:aws:sns:us-west-2:005837367462:abstracts_disliked', $scope.abstractId);
              $scope.likeStatus = false; // false == disliked
            }
          };

          $scope.viewAbstract = function() {
            //$scope.updateModal();
            $.getScript("scripts/controllers/main.js", function(){
              var eleme = document.getElementById('myModals');
              angular.element(eleme).scope().updateModal($scope.s3Data.AbstractTitle,$scope.s3Data.FirstName[0],
                $scope.s3Data.LastName,$scope.s3Data.Abstract);
              angular.element(eleme).scope().$apply();
            });

            
            $('#myModals').modal('show');
          };

    	}],
    	template: '<li class="list-group-item">' +
                  '<div class="btn-group" data-toggle="buttons">' +
                    '<label class="btn btn-primary" ng-click="likeClick()">' +
                      '<input type="radio" name="likeBtn" > <span class="glyphicon glyphicon-thumbs-up"></span>' +
                    '</label>' +
                    '<label class="btn btn-primary" ng-click="dislikeClick()">' +
                      '<input type="radio" name="likeBtn" > <span class="glyphicon glyphicon-thumbs-down"></span>' +
                    '</label>' +
                    '<label class="btn btn-primary" ng-click="viewAbstract()">' +
                      '<input type="radio" name="viewBtn" > <span class="glyphicon glyphicon-search"></span>' +
                    '</label>' +
                  '</div>' +
                  '<p>{{likeMsg}}</p>' +
        	        '<h4 class="list-group-item-heading"> {{s3Data.AbstractTitle}} </h4>' +
            	    '<input type="checkbox" class="pull-right abstractChck" value="{{abstractId}}">' +
                	'<p class="list-group-item-text"> Author: {{s3Data.FirstName[0] + ". " + s3Data.LastName}} </p>' +
              	'</li>',
      link: function (scope, element, attrs) {
      	scope.abstractId = attrs.abstractId;
        scope.getS3Data();
      }
    };
  });
