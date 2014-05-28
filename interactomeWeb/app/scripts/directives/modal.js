'use strict';

/*

This directive listens for an emit. It will retrieve s3 abstract and
author names if either one is already missing.

*/

angular.module('interactomeApp')
  .directive('modal', function () {
    return {	
      	restrict: 'E',
      	scope: {},

				controller: ['$rootScope', '$scope', '$http', 'AwsService', function($rootScope, $scope, $http, AwsService) {    
      	
	  		$rootScope.$on('showModal', function(event, paper) {
	        $scope.showModal(paper);
	      });

    		$scope.showModal = function(paper) {
      		if (paper.s3Data === undefined || paper.authorData) {
            $http.get(paper.Link).success(function(data) { // get s3 abstract and author names once, together
            	paper.s3Data = data;
            	AwsService.getBatchUser(paper.Authors).then(function(names) { // replace User Id's with real author names
              	var temp = "";
              	// Ensure the correct order by adding one at a time to the string to display
              	// Authors will be in order and we can't trust AWS to give us the correct order.
              	for(var j = 0; j < paper.Authors.length; j++) {
                	for(var i = 0; i < names.length; i++) {
                		if (paper.Authors[j] == names[i].Id) {
                  		temp += (names[i].FirstName + " " + names[i].LastName + ", ");
                  	}
                	}
              	}
              	paper.authorData = temp.slice(0, -2);

              	$scope.modalTitle = paper.Title;
								$scope.modalAuthor = paper.authorData;
								$scope.modalText = paper.s3Data.Abstract;
								$('#abstractViewModal').modal('show'); // open modal

            	}, function(reason) {
            		alert(reason);

              	$scope.modalTitle = 'ERROR';
						  	$scope.modalAuthor = '';
						  	$scope.modalText = 'Could not find abstract.';
							  $('#abstractViewModal').modal('show'); // open modal
            	});

          	}).error(function() {
          		$scope.modalTitle = 'ERROR';
							$scope.modalAuthor = '';
							$scope.modalText = 'Could not find abstract.';
							$('#abstractViewModal').modal('show'); // open modal
          	})
          }
          else {
          	$scope.modalTitle = paper.Title;
						$scope.modalAuthor = paper.authorData;
						$scope.modalText = paper.s3Data.Abstract;
						$('#abstractViewModal').modal('show'); // open modal
          }
        };

    	}],
	      templateUrl: 'scripts/directives/modal.html',
	      link: function (scope, element, attrs) {
      	}
    };
 }); 
