// James O'Donoghue
// Recommendation Module

// Description: This is the template for a potential Recommendation module. 
// Simply takes in 5 abstracts and spits out a random 20. 


var testPapers = ['Paper45086', 'Paper47394', 'Paper45430', 'Paper41361', 'Paper46948'];



function recMod()
{
	AWS.config.update({
        accessKeyId: 'AKIAIDUN4LXNRGYQWQ4Q', 
        secretAccessKey: '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', 
        region: 'us-west-2'
    });

	var recAbstracts = ['']

	var userTable = new AWS.DynamoDB({params: {TableName: "Paper"}});
	var key = "Paper45086";

	userTable.getItem({Key: {Id: {S: key}}}, function(err, data){
		if(err)
			console.log(err);
		else
			console.log("Random paper info: " + data.Item);

	});
}