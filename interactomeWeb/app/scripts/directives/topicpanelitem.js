'use strict';
/**
  Lists collapsible panels of user topics
**/

angular.module('interactomeApp')
  .directive('topicPanelItem', function () {
    return {	
      	restrict: 'E',
      	scope: {      	
      		topicName: '@',
          papersList: '@'
      	},
		    controller: ['$scope', '$http', 'AwsService', function($scope, $http, AwsService) {
      		/*$scope.getS3Data = function() {
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
          };*/
          
          $scope.arr = [];
    	}],
    	template: '<accordion>' +
                  '<accordion-group heading="{{topicName}}">' +
                      '<li ng-repeat="paper in arr track by $index">' + // track by $index solves ng-repeat duplicate error: http://stackoverflow.com/questions/16296670/angular-ng-repeat-error-duplicates-in-a-repeater-are-not-allowed
                        '{{paper}}' +
                      '</li>' +
                  '</accordion-group>' +
                '</accordian>',
      link: function (scope, element, attrs) {
        scope.topicName = attrs.topicName;
        //scope.papersList = ((attrs.papersList).replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi,'')).split(',');
        scope.arr = ((attrs.papersList).replace(/[`~!@#$%^&*()_|+\-=?;:'".<>\{\}\[\]\\\/]/gi,'')).split(',');
        //scope.papersList = arr;
        scope.papersList = ['topicsa', 'topicsb'];
        console.log("in topicPanelItem");
        console.log(scope.arr, (typeof scope.arr));
      }
    };
  });

/*

                    '<div ng-repeat="paper in {{papersList}}">' +
                      'paper' +
                    '</div>' + ng-init="tempA = [\'topicsa\', \'topicsb\']"*/