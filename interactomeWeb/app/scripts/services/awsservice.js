'use strict';
/**
    This service handles the AWS resources. Setting or getting, should be through this API.


var app = angular.module('interactomeApp.Awsservice', []);


// creating service type provider. Provider used to configure service before app runs. 
app.provider('AwsService', function() {

    I decided to use an observer pattern for notifying subscribers instead of $watch and $digest. I couldn't seem to get them to bind correctly
    when trying to use the mainCtrl. The observer pattern is slightly more wordy
**/
var app = angular.module('interactomeApp.AwsService', [])


// creating service type provider. Provider used to configure service before app runs.
app.provider('AwsService', function() {
    var self = this;
    self.s3AbstractLinks = []
    self.dynamoTopics = [];
    AWS.config.region = 'us-west-2';
    self.arn = null;

    self.setArn = function(arn) {
        if (arn) self.arn = arn;
    }

    self.setRegion = function(region) {
        if (region) AWS.config.region = region;
    }



    self.$get = function($q, $cacheFactory, $http, $rootScope) {
        var _DYNAMOBROADCAST = 'dynamoTopicsBroadcast@AwsService';
        var _S3BROADCAST = 's3Abstracts@AwsService';
        var credentialsDefer = $q.defer();
        var credentialsPromise = credentialsDefer.promise;
        var _SNSTopics = {};
        return {

            // Simple getters / constants
            credentials: function() {
                return credentialsPromise;
            },
            s3Broadcast: _S3BROADCAST,
            dynamoBroadcast: _DYNAMOBROADCAST,

            setToken: function(token) {
                var config = {
                    RoleArn: self.arn,
                    WebIdentityToken: token,
                    RoleSessionName: 'sage-app'

                }

                self.config = config;
                AWS.config.credentials =
                    new AWS.WebIdentityCredentials(config);
                credentialsDefer
                    .resolve(AWS.config.credentials);


                // Refactor Warning: this should probably just be an event that is broadcasted letting subscribers know that credentials have been loaded.
                this._getS3URLs();
                this._getDynamoTopics();
            }, // end of setToken func 

            /**
                This will eventually change once we get the recmod up and going (it will feed how we get abstracts).
                I believe it is also bad form to manipulate the dom from inside of a service.
                However, this fits our needs for now.

                Note: I'm not sure if this should go on the outside of $get or not. I'm not going to worry about it for now as this will go away anyway 
                    after rec is implemented.
                - Nathan
            **/
            _getS3URLs: function() {

                // Simply list 10 abstracts json files on page to show connection to S3, will place in proper angular architecture later
                var bucket = new AWS.S3({
                    params: {
                        Bucket: 'sagebionetworks-interactome-abstracts'
                    }
                });
                bucket.listObjects(function(err, data) {
                    if (err) {
                        document.getElementById('status').innerHTML =
                            'Could not load objects from S3';
                        console.log(err);
                    } else {
                        document.getElementById('status').innerHTML =
                            'Loaded ' + data.Contents.length + ' items from S3';

                        // Clear the array and replace it with new abstracts
                        self.s3AbstractLinks.length = 0;
                        // Not sure how to avoid hardcoding this url.
                        var urlBase = "https://s3-us-west-2.amazonaws.com/sagebionetworks-interactome-abstracts/";
                        var wholeLink = "";
                        for (var i = 0; i < 10; i++) {
                            wholeLink = urlBase + data.Contents[i].Key;
                            self.s3AbstractLinks.push(wholeLink);
                        }
                        // Broadcast that the abstracts are ready
                        $rootScope.$broadcast(_S3BROADCAST);
                    }
                });
            },

            _getDynamoTopics: function() {
                console.log("in gentdynamotopics");
                var dynamodb = new AWS.DynamoDB();
                var params = {
                    TableName: 'Topic',
                    Select: 'ALL_ATTRIBUTES',
                };
                dynamodb.scan(params, function(err, data) {
                    if (err) console.log(err, err.stack);
                    else {
                        for(var i = 0; i < data.Count; i++) {
                            if('List' in data.Items[i]) {
                            }
                            self.dynamoTopics.push(data.Items[i]['Name']['S']);
                        }
                    }
                });
                $rootScope.$broadcast(_DYNAMOBROADCAST);
            },

            getLoadedDynamoTopics: function() {
                return self.dynamoTopics;
            },

            // Should only be called after the _getS3URLs' broadcast 
            // Will probably return undefined if called premature
            getLoadedS3Links: function() {
                return self.s3AbstractLinks;
            },

            // General way to post a msg to a topic.
            // Topics are stored inside of a hash for optimization.
            postMessageToSNS: function(topicArn, msg) {
                if (!topicArn || !msg) {
                    console.log("postMessageToSNS param error. topicArn: " + topicArn + " msg: " + msg);
                    return;
                }

                // We store the SNS on first topic usage to avoid multiple instantiations
                var sns = _SNSTopics[topicArn];
                if (sns == undefined) {
                    sns = new AWS.SNS({
                        params: {
                            TopicArn: topicArn
                        }
                    });
                    _SNSTopics[topicArn] = sns;
                }

                sns.publish({
                    Message: msg
                }, function(err, data) {
                    // if (!err) console.log(publishedmsg);
                });
            },

            // Adds the abstractId into either the "Likes" or "Dislikes" attribute in "Interactions."
            // Was unsure about naming conventions with get, set, post etc.
            updateDynamoPref: function(absId, liked) {
                var interTable = new AWS.DynamoDB({
                    params: {
                        TableName: 'Interactions'
                    }
                });

                if (liked) {
                    var params = {
                        AttributesToGet: [
                            'Dislikes'
                        ],
                        Key: {
                            "Id": {
                                "S": 'GeneralThread'
                            }
                        }
                    };

                    // Unfinished - once done this will check to see if the abstract exists in the dislikes
                    // attribute, if so it will remove it. 
                    interTable.getItem(params, function(err, data) {
                        if (err)
                            console.log("Error: " + err);
                        else {
                            // Check if abstract in Dislikes then remove and place in likes
                        }
                    });

                    // To store the absId
                    var likesArr = [absId];

                    var updateParams = {
                        Key: {
                            "Id": {
                                "S": 'GeneralThread'
                            }
                        },
                        AttributeUpdates: {
                            "Likes": {
                                "Action": "ADD",
                                "Value": {
                                    "SS": likesArr
                                }
                            }
                        }
                    }

                    // Update our table to include the new abstract
                    interTable.updateItem(updateParams, function(err, data) {
                        if (err)
                            console.log("Error: " + err);
                        else {
                            console.log("Success!" + data)
                        }
                    });

                } else {
                    // almost identical to likes
                    var params = {
                        AttributesToGet: [
                            'Likes'
                        ],
                        Key: {
                            "Id": {
                                "S": 'GeneralThread'
                            }
                        }
                    };

                    interTable.getItem(params, function(err, data) {
                        if (err)
                            console.log("Error: " + err);
                        else {
                            // Check if abstract in Likes then remove and place in likes
                        }
                    });


                    var dislikesArr = [absId];

                    var updateParams = {
                        Key: {
                            "Id": {
                                "S": 'GeneralThread'
                            }
                        },
                        AttributeUpdates: {
                            "Dislikes": {
                                "Action": "ADD",
                                "Value": {
                                    "SS": dislikesArr
                                }
                            }
                        }
                    }

                    // Update our table to include the new abstract
                    interTable.updateItem(updateParams, function(err, data) {
                        if (err)
                            console.log("Error: " + err);
                        else {
                            console.log("Success!" + data)
                        }
                    });
                }

            }


        } // end of return 
    }
});

app.factory('SearchService', function($q) {

    // factory returns entire service as object 
    return {
        showResults: function(institution) {
            var results = institution;
            var defered = $q.defer(); // set up defered for asyncronous calls to Dynamo 

            var userTable = new AWS.DynamoDB();
            // Set params for query 
            var params = {
                TableName: 'User',
                IndexName: 'InstitutionName-index',
                KeyConditions: {
                    "InstitutionName": {
                        "AttributeValueList": [{


                            "S": results

                        }],

                        ComparisonOperator: "EQ"
                    }
                }
            };

            var userData = [];
            // run query 
            userTable.query(params, function(err, data) {
                if (err) {

                    console.log(err);
                } else {

                    for (var i = 0; i < data.Items.length; i++) {

                        userData.push(data.Items[i]);
                    }

                    // resolve defered 
                    defered.resolve(userData);

                }
            });
            // return promise 
            return defered.promise;
        },
    };
});








/* Yo build came with this, commented it out. 
.service('Awsservice', function Awsservice() {
    // AngularJS will instantiate a singleton by calling "new" on this function
});
*/