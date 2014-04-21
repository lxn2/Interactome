'use strict';
/*
  This service takes care of contacting the reccomendation system.

  Not enough error handling to make this service robust. However, due to the looming eventuallity of a complete rewrite, I don't see the point
  in making it robust.
*/
angular.module('interactomeApp.RecommendationService', [])
  .factory('RecommendationService', function RecommendationService($q) {
    var service = {
      // getRecs:
      //   @abstractList: should be a list of the dynamo Id's
      //   Returns: a promise which will resolve to an array of hashes that have paper data from dynamo.
      getRecs: function(abstractList) {
          var defered = $q.defer();

          var limit = 100 + abstractList.length; // min of abstracts needed to make sure no duplicates returned

          // Scan table for limit number of papers
          if(abstractList.length > 0) {
            var paperTable = new AWS.DynamoDB({params: {TableName: "Paper"}});
            var returnedPapers  = [];
            paperTable.scan({Limit: limit}, function(err, data) {
              if(err)
                console.log(err);
              else { 
                var paperId = "";
                for(var i = 0; i < limit; i++) {
                  paperId = data.Items[i].Id.S;
                  if (abstractList.indexOf(paperId) == -1 )// not in list sent in
                    returnedPapers.push({
                      Id: paperId, 
                      Link: data.Items[i].Link.S,
                      Title: data.Items[i].Title.S,
                      Authors: (data.Items[i].Authors.S).split(',')
                    })
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
