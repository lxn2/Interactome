// James O'Donoghue
// Recommendation Module

// Description: This is the template for a potential Recommendation module. 
// Simply takes in 5 abstracts and spits out 20 abstract IDs

// Sample array used to test rec response
var testPapers = ['Paper45086', 'Paper47394', 'Paper45430', 'Paper41361', 'Paper46948'];

function recMod()
{
	var limit = 20;

	var userTable = new AWS.DynamoDB({params: {TableName: "Paper"}});

	// Scan table using limit as a parameter
	userTable.scan({Limit: limit}, function(err, data){
		if(err)
			console.log(err);
		else{
			for(var i = 0; i < limit; i++){
				var j = 0;
				while(data.Items[i].Id.S != testPapers[j] && j < testPapers.size)
					j++;
				if(data.Items[i].Id.S != testPapers[j]){
            		document.getElementById('abstracts').innerHTML +=
        				"<li>" + data.Items[i].Id.S + "</li>";
        			}
        		}
        	}
        });
}

