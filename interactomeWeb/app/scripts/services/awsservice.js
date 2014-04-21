'use strict';
/**
    This service handles the AWS resources. Setting or getting, should be through this API.
    
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

    self.$get = function($q, $cacheFactory, $http) {
        var credentialsDefer = $q.defer();
        var credentialsPromise = credentialsDefer.promise;
        var DynamoTopics = [];
        var _SNSTopics = {};
        return {

            // Use for this thread: AwsService.credentials().then...
            credentials: function() {
                return credentialsPromise;
            },

            setToken: function(token) {
                var config = {
                    RoleArn: self.arn,
                    WebIdentityToken: token,
                    RoleSessionName: 'sage-app'

                }

                self.config = config;
                AWS.config.credentials = new AWS.WebIdentityCredentials(config);
                credentialsDefer.resolve(AWS.config.credentials);

                self._lastEvalKey = null;
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
                        User: {
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
                        console.log(err, err.stack);
                        topicDefer.reject('Cannot query Topic table');
                    }
                    else {
                        for(var i = 0; i < data.Count; i++) { // loop through all Topic entrees
                            if('List' in data.Items[i]) { // add paper array to topics array if exists
                                var papersArray = data.Items[i]['List']['SS'];
                                topicsArray.push({
                                    Name: data.Items[i]['Name']['S'],
                                    Id: data.Items[i]['Id']['S'],
                                    PapersList: papersArray
                                });
                            }
                            else {
                                topicsArray.push({
                                    Name: data.Items[i]['Name']['S'],
                                    Id: data.Items[i]['Id']['S']
                                });
                            }
                        }
                        topicsArray.sort(function(a,b) {
                            return (a['Name'].localeCompare(b['Name'], 'kn', {numeric: true, caseFirst: "lower", usage: "sort"}) >= 0);
                        });
                        topicDefer.resolve(topicsArray);
                    }
                });
                return topicDefer.promise;
            },

            deleteTopic: function(topicid) {
                var defer = $q.defer();
                var dynamodbB = new AWS.DynamoDB();

                var deleteParams = {
                    Key: {
                        Id: {
                            S: topicid,
                        },
                    },
                    TableName: 'Topic',

                };
                dynamodbB.deleteItem(deleteParams, function(err, data) {
                    if (err) {
                        console.log(err, err.stack);
                        defer.reject('Could not delete topic');
                    }
                    else {
                        defer.resolve();
                    }
                });
                return defer.promise;
            },

            // puts new Topic item into Dynamo
            _putNewTopic: function(username, topicname) { // private
                var defer = $q.defer();
                var dynamodb = new AWS.DynamoDB();

                // params to update & get new Sequence from Sequencer table
                var sequenceParams = {
                    TableName: 'Sequencer',
                    AttributeUpdates: {
                        Sequence: {
                            Action: 'ADD',
                            Value: {
                                N: '1',
                            },
                        },
                    },
                    Key: {
                        Id: {
                            N: '1',
                        }
                    },
                    ReturnValues: 'UPDATED_NEW',
                };
                var seq = "";

                // call update to Sequencer
                dynamodb.updateItem(sequenceParams, function(err, data) {
                    if (err) {
                        console.log(err, err.stack);
                        defer.reject('Cannot update Sequencer');
                    }
                    else {
                        seq = data.Attributes['Sequence']['N'];
                        var topicId = 'Topic' + seq;

                        // params to put new item into Topics
                        var putParams = {
                            Item: {
                                Id: {
                                    S: topicId
                                },
                                Name: {
                                    S: topicname
                                },
                                User: {
                                    S: username
                                }
                            },
                            TableName: 'Topic'
                        };

                        // call update to Topic
                        dynamodb.putItem(putParams, function(err, data) {
                            if (err) {
                                console.log(err, err.stack);
                                defer.reject('Cannot put Topic item');
                            }
                            else {
                                defer.resolve(topicId);
                            }
                        });
                    }
                });
                return defer.promise;
            },

            // Adds topic to Dynamo Topic table
            addTopic: function(username, topicName) {
                var topicDefer = $q.defer();
                var dynamodb = new AWS.DynamoDB();
                var self = this;

                // params for query table for existing topic
                var params = {
                    TableName: 'Topic',
                    IndexName: 'User-index',
                    Select: 'COUNT',
                    KeyConditions: {
                        User: {
                            ComparisonOperator: 'EQ',
                            AttributeValueList: [
                                {
                                    'S': username,
                                }
                            ],
                        },
                        Name: {
                            ComparisonOperator: 'EQ',
                            AttributeValueList: [
                                {
                                    'S': topicName,
                                },
                            ],
                        }
                    },
                };

                dynamodb.query(params, function(err, data) {
                    if (err) { // query error
                        console.log(err, err.stack);
                        topicDefer.reject('Cannot query Topic table');
                    }
                    else if (data.Count == 0) { // if topic doesn't exist, add it
                        self._putNewTopic(username,topicName).then(function(topicId) {
                            topicDefer.resolve(topicId);
                        }, function(reason) {
                            topicDefer.reject(reason);
                        });
                        
                    }
                    else { // if exists, don't add
                        topicDefer.reject("Topic already exists");
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
                                Link: data.Items[i].Link.S,
                                Title: data.Items[i].Title.S,
                                Authors: (data.Items[i].Authors.S).split(',')
                            });

                        }
                        self._lastEvalKey = data.LastEvaluatedKey;
                        paperDefer.resolve(papers);
                    }
                });

                return paperDefer.promise;
            },

            // Get users by a list of their Ids.
            getBatchUser: function(Ids) {
                var batchUserDefer = $q.defer();
                var names = [];
                var dynamodb = new AWS.DynamoDB();
                // Since batchGets can do multiple tables the syntax is a bit weird.
                var batchParams = {
                    RequestItems:
                    {
                        User: {
                            AttributesToGet: ['Id','FirstName','LastName'],
                            Keys: []
                        }
                    }
                };

                for(var i = 0; i < Ids.length; i++){
                    batchParams.RequestItems.User.Keys.push({"Id": {"S": Ids[i]}});
                }

                dynamodb.batchGetItem(batchParams, function(err, data) {
                    if (err) { // query error
                        console.log(err, err.stack);
                        topicDefer.reject('Cannot query Topic table');
                    } else{
                        for (var i = 0; i < data.Responses.User.length; i++) {
                            names.push({ 
                                Id: data.Responses.User[i].Id.S,
                                FirstName: data.Responses.User[i].FirstName.S, 
                                LastName: data.Responses.User[i].LastName.S});
                        }
                        batchUserDefer.resolve(names);
                    }
                });

                return batchUserDefer.promise;

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