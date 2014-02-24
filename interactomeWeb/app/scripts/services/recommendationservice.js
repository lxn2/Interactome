'use strict';

angular.module('interactomeApp.RecommendationService', [])
  .factory('RecommendationService', function RecommendationService($q) {
    var service = {
      getRecs: function(abstractList) {
          var defered = $q.defer();

          var limit = 10 + abstractList.length; // min of papers needed to make sure no duplicates returned
          var papers = [];
          for(var i = 0; i < abstractList.length; i++)
            papers.push("Paper" + abstractList[i].match(/(\d+)/)[0]); // grabs digits out of the list

          // Scan table for limit number of papers
          if(papers.length > 0) {
            var paperTable = new AWS.DynamoDB({params: {TableName: "Paper"}});
            var returnedPapers  = [];
            paperTable.scan({Limit: limit}, function(err, data) {
              if(err)
                console.log(err);
              else { 
                for(var i = 0; i < limit; i++) {
                  var tempId = data.Items[i].Link.S;
                  if ( papers.indexOf(tempId) == -1 )// not in list sent in
                    returnedPapers.push(tempId)
                }
                defered.resolve(returnedPapers);
              }
            });
          }

          return defered.promise;

        },


    };
    return service;
  });
