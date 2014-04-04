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
    AWS.config.region = 'us-west-2';
    self.arn = null;

    self.setArn = function(arn) {
        if (arn) self.arn = arn;
    }

    self.setRegion = function(region) {
        if (region) AWS.config.region = region;
    }



    self.$get = function($q, $cacheFactory, $http, $rootScope) {
        var _TOKENBROADCAST = 'tokenSet@AwsService';
        var credentialsDefer = $q.defer();
        var credentialsPromise = credentialsDefer.promise;
        var DynamoTopics = [];
        var _SNSTopics = {};
        return {

            // Simple getters / constants
            credentials: function() {
                return credentialsPromise;
            },
            tokenSetBroadcast: _TOKENBROADCAST,

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


                // Let anyone listening that AWS resources can now be used
                self._lastEvalKey = null;
                $rootScope.$broadcast(_TOKENBROADCAST);
            }, // end of setToken func 

            // Gets topics from dynamo table, currently paper Id's
            // Should eventually return paper Names and/or links
            getTopics: function(username) {
                var topicDefer = $q.defer();
                var dynamodb = new AWS.DynamoDB(); // should we catch error for this too?
                var params = {
                    TableName: 'Topic',
                    Select: 'ALL_ATTRIBUTES',
                    IndexName: 'User-index',
                    KeyConditions: {
                        'User': {
                            ComparisonOperator: 'EQ',
                            AttributeValueList: [
                                {
                                    S: username
                                }
                            ]
                        }
                    }
                }
                var topicsArray = []; // list of dictionaries
                dynamodb.query(params, function(err, data) {
                    if (err) {
                        topicDefer.reject(err, err.stack);
                    }
                    else {
                        for(var i = 0; i < data.Count; i++) { // loop through all Topic entrees
                            if('List' in data.Items[i]) { // add paper array to topics array if exists
                                var papersArray = data.Items[i]['List']['SS'];
                                topicsArray.push({
                                    Name: data.Items[i]['Name']['S'],
                                    PapersList: papersArray
                                });
                            }
                            else {
                                topicsArray.push({
                                    Name: data.Items[i]['Name']['S'] 
                                });
                            }
                        }
                        topicsArray.sort(function(a,b) {
                            return a['Name'] > b['Name'];
                        });
                        topicDefer.resolve(topicsArray);
                    }
                });
                return topicDefer.promise;
            },

            // Gets the next limit number of papers from dynamo
            // This will eventually be done using the rec service (instead of scanning)
            getPapers: function(limit) {
                var paperDefer = $q.defer();
                var papers = [];
                var paperTable = new AWS.DynamoDB({
                    params: {
                        TableName: "Paper"
                    }
                });
                var scanParams = {
                    Limit: limit
                };
                if (self._lastEvalKey != null)
                    scanParams.ExclusiveStartKey = self._lastEvalKey;

                paperTable.scan(scanParams, function(err, data) {
                    if (err)
                        console.log(err);

                    else {
                        for (var i = 0; i < data.Items.length; i++) {
                            papers.push({
                                Id: data.Items[i].Id.S,
                                Link: data.Items[i].Link.S
                            });

                        }
                        self._lastEvalKey = data.LastEvaluatedKey;
                        paperDefer.resolve(papers);
                    }
                });

                return paperDefer.promise;
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
            
            updateDynamoPref: function(paperId, liked, username) {
                var recLikesTable = new AWS.DynamoDB({
                    params: {
                        TableName: 'Recommendation_Likes'
                    }
                });

                //To hold the bool to determine if abstract exists in the opposite attribute (Likes/Dislikes)
                var exists;

                if (liked) {
                    // To hold get parameters
                    var getParams = {
                        AttributesToGet: [
                        'Dislikes'
                        ],
                        Key: {
                            "User": {
                                "S": username
                            },
                            "Context": {
                                "S": 'GeneralThread'
                            }
                        }
                    }

                    // For adding abstract to Likes
                    var updateAdd = {
                        Key: {
                            "User": {
                                "S": username
                            },
                            "Context": {
                                "S": 'GeneralThread'
                            }
                        },
                        AttributeUpdates: {
                            "Likes": {
                                "Action": "ADD",
                                "Value": {
                                    "SS": [paperId]
                                }
                            }
                        }
                    }

                    // For removing abstract from Dislikes 
                    var updateRemove = {
                        Key: {
                            "User": {
                                "S": username
                            },
                            "Context": {
                                "S": 'GeneralThread'
                            }
                        },
                        AttributeUpdates: {
                            "Dislikes": {
                                "Action": "DELETE",
                                "Value": {
                                    "SS": [paperId]
                                }
                            }
                        }
                    }

                    // Function returns true if it found the Id in Dislikes
                    exists = recLikesTable.getItem(getParams, function(err, data){
                        if (err)
                            console.log("Error: " + err);
                        else {
                            var i = 0;
                            console.log(data.Item.Dislikes.SS)
                            while(i < data.Item.Dislikes.SS.length && paperId != data.Item.Dislikes.SS[i])
                                i++;
                            if(i < data.Item.Dislikes.SS.length){
                                console.log("It's in Dislikes!");
                                exists = true;      
                            }
                        }
                        return exists;
                    });

                    // If found remove from Dislikes
                    if(exists){
                        recLikesTable.updateItem(updateRemove, function(err, data){
                            if(err)
                                console.log(err);
                            else
                                console.log(paperId + " was removed!");
                        });
                    }

                    // Add Id to Likes
                    recLikesTable.updateItem(updateAdd, function(err, data){
                        if(err)
                            console.log(err);
                        else
                            console.log(paperId + " was added!");
                    });

                } else {
                    // almost identical to likes
                    var getParams = {
                        AttributesToGet: [
                        'Likes'
                        ],
                        Key: {
                            "User": {
                                "S": username
                            },
                            "Context": {
                                "S": 'GeneralThread'
                            }
                        }
                    }

                    var updateAdd = {
                        Key: {
                            "User": {
                                "S": username
                            },
                            "Context": {
                                "S": 'GeneralThread'
                            }
                        },
                        AttributeUpdates: {
                            "Dislikes": {
                                "Action": "ADD",
                                "Value": {
                                    "SS": [paperId]
                                }
                            }
                        }
                    }

                    var updateRemove = {
                        Key: {
                            "User": {
                                "S": username
                            },
                            "Context": {
                                "S": 'GeneralThread'
                            }
                        },
                        AttributeUpdates: {
                            "Likes": {
                                "Action": 'DELETE',
                                "Value": {
                                    "SS": [paperId]
                                }
                            }
                        }
                    }
                    exists = recLikesTable.getItem(getParams, function(err, data){
                        if (err)
                            console.log("Error: " + err);
                        else {
                            var i = 0;
                            while(i < data.Item.Likes.SS.length && paperId != data.Item.Likes.SS[i])
                                i++;
                            if(i < data.Item.Likes.SS.length){
                                console.log( paperId + " is in Likes!");
                                exists = true;      
                            }
                        }
                        return exists;
                    });

                    console.log(exists);

                    if(exists){
                        recLikesTable.updateItem(updateRemove, function(err, data){
                            if(err)
                                console.log(err);
                            else{
                                console.log(paperId + " was removed!");
                                console.log(data);
                            }
                        });
                    }

                    recLikesTable.updateItem(updateAdd, function(err, data){
                        if(err)
                            console.log(err);
                        else
                            console.log(paperId + " was added!");
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