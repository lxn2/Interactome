// James O'Donoghue
// Recommendation Module

// Description: This is the template for a potential Recommendation module. 
// Simply takes in 5 abstracts and spits out 20 abstract IDs

// Sample array used to test rec response
//var papers = ['Paper45086', 'Paper47394', 'Paper45430', 'Paper41361', 'Paper46948'];

function recMod(abstractList)
{
	var limit = 10 + abstractList.length; // min of papers needed to make sure no duplicates returned
  console.log(abstractList);
  papers = [];
  for(var i = 0; i < abstractList.length; i++)
    papers.push("Paper" + abstractList[i].match(/(\d+)/)[0]); // grabs digits out of the list

	// Scan table for limit number of papers
  if(papers.length > 0) {
    console.log(papers);
    var paperTable = new AWS.DynamoDB({params: {TableName: "Paper"}});
    var returnedPapers  = [];
  	paperTable.scan({Limit: limit}, function(err, data) {
  		if(err)
  			console.log(err);
  		else { 
  			for(var i = 0; i < limit; i++) {
          var tempId = data.Items[i].Id.S;
          if ( papers.indexOf(tempId) == -1 )// not in list sent in
            returnedPapers.push(tempId)
        }
      }
    }).then(function() { return returnedPapers; });
  }
  console.log("blah");
  return returnedPapers;
}
