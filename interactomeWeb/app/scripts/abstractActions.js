// Author: Nathan Lucyk
// This is a dirty way of sending selected papers to SNS
// This code should be refactored into an angular way of doing it.

function abstractsReq()
{
	var sns = new AWS.SNS({params: {TopicArn: 'arn:aws:sns:us-west-2:005837367462:abstracts_req'}});
	var chkId = ''
	$("input:checked").each(function() {
		chkId += $(this).val() + ",";
    });
    if (chkId != '') {
	    chkId =  chkId.slice(0,-1)// Remove last comma

		sns.publish({Message: chkId}, function (err, data) {
			if (!err) console.log(chkId);
		});
	}
}

function abstractLiked() 
{
	var sns = new AWS.SNS({params: {TopicArn: 'arn:aws:sns:us-west-2:005837367462:abstracts_liked'}});
	sns.publish({Message: 'THE MESSAGE TO PUBLISH'}, function (err, data) {
		if (!err) console.log('Message published');
	});
}