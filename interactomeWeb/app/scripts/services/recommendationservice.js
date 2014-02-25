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
      //   @abstractList: should be a list of the full url. Relies on the assumption of a '/' and .json to work.
      //   Returns: a promise which will resolve to an array of S3 links to abstracts that may or may not exist.
      getRecs: function(abstractList) {
          var defered = $q.defer();

          var limit = 10 + abstractList.length; // min of abstracts needed to make sure no duplicates returned
          var sourceAbstracts = [];

          // This will get the last index of / and grab the substring until the end of it.
          // This will create an array of just the Abstract####.json part of the url.
          for(var i = 0; i < abstractList.length; i++)
            sourceAbstracts.push(abstractList[i].substr(abstractList[i].lastIndexOf("/")+1));

          // Scan table for limit number of papers
          if(sourceAbstracts.length > 0) {
            var paperTable = new AWS.DynamoDB({params: {TableName: "Paper"}});
            var returnedPapers  = [];
            paperTable.scan({Limit: limit}, function(err, data) {
              if(err)
                console.log(err);
              else { 
                for(var i = 0; i < limit; i++) {
                  var fullLink = data.Items[i].Link.S;
                  var endOfLink = fullLink.substr(fullLink.lastIndexOf("/")+1);
                  if (sourceAbstracts.indexOf(endOfLink) == -1 )// not in list sent in
                    returnedPapers.push(fullLink)
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
