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

      controller: ['$rootScope', '$scope', '$http', '$q', 'AwsService', function($rootScope, $scope, $http, $q, AwsService) {    

        $rootScope.$on('showModal', function(event, paper) {
          $scope.showModal(paper);
        });

        $scope.getS3Abstract = function(paper) {
          var getAbstractDefer = $q.defer();
          if(paper.s3Data === undefined) {
            $http.get(paper.Link).success(function(data) { 
              paper.s3Data = data;
              getAbstractDefer.resolve(paper);
            }).error(function() {
              paper.s3Data = {};
              paper.s3Data.Abstract = 'ERROR: Could not find abstract';
              getAbstractDefer.resolve(paper);
            })
          }
          else {
            getAbstractDefer.resolve(paper);
          }

          return getAbstractDefer.promise;
        };

        $scope.getNames = function(paper) {
          var getNamesDefer = $q.defer();

          if(paper.authorData === undefined) {
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
              getNamesDefer.resolve(paper);
            }, function(reason) {
              paper.authorData = 'ERROR: ' + reason;
              getNamesDefer.resolve(paper);
            });
          }
          else {
            getNamesDefer.resolve(paper);
          }

          return getNamesDefer.promise;
        };

        $scope.showModal = function(paper) {

          var promise = $scope.getS3Abstract(paper);
          promise.then( function(paper) {
            $scope.getNames(paper).then(function(paper) {
              $scope.modalTitle = paper.Title;
              $scope.modalAuthor = paper.authorData;
              $scope.modalText = paper.s3Data.Abstract;
              $scope.modalObj.modal('show');
            });
          });
        };

      }],
      templateUrl: 'scripts/directives/modal.html',
      link: function (scope, element, attrs) {
        scope.modalObj = angular.element(element.children()[0]); 
      }
    };
  }); 
