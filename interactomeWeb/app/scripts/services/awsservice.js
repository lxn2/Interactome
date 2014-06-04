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

            renameTopic: function(topicid, topicname) {
                var defer = $q.defer();
                var dynamodb = new AWS.DynamoDB();

                var renameParams = {
                    Key: {
                        Id: {
                            S: topicid,
                        },
                    },
                    TableName: 'Topic',
                    AttributeUpdates: {
                        Name: {
                            Action: 'PUT',
                            Value: {
                                S: topicname
                            }
                        },
                    }

                };
                dynamodb.updateItem(renameParams, function(err, data) {
                    if (err) {
                        console.log(err, err.stack);
                        defer.reject('Could not rename topic');
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

            saveTopicPaper: function(topicid, paperid) {
                var savePaperDefer = $q.defer();
                var dynamodb = new AWS.DynamoDB();

                var updateParams = {
                    Key: {
                        Id: {
                            S: topicid
                        },
                    },
                    TableName: 'Topic',
                    AttributeUpdates: {
                        List: {
                            Action: 'ADD',
                            Value: {
                                SS: [paperid],
                            }
                        }
                    }
                };

                dynamodb.updateItem(updateParams, function(err, data) {
                    if (err) {
                        console.log(err, err.stack);
                        savePaperDefer.reject('Cannot update Topic table');
                    }
                    else {
                        savePaperDefer.resolve();
                    }
                });

                return savePaperDefer.promise;
            },

            deleteTopicPaper: function(topicid, paperid) {
                var deletePaperDefer = $q.defer();
                var dynamodb = new AWS.DynamoDB();

                var deleteParams = {
                    Key: {
                        Id: {
                            S: topicid
                        },
                    },
                    TableName: 'Topic',
                    AttributeUpdates: {
                        List: {
                            Action: 'DELETE',
                            Value: {
                                SS: [paperid],
                            }
                        }
                    }
                };

                dynamodb.updateItem(deleteParams, function(err,data) {
                    if (err) {
                        console.log(err, err.stack);
                        deletePaperDefer.reject('Cannot update Topic table');
                    }
                    else {
                        deletePaperDefer.resolve();
                    }
                })

                return deletePaperDefer.promise;
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
                                Title: data.Items[i].Title.S.replace(/<[b\sB]+>/g, ''),
                                Authors: (data.Items[i].Authors.S).split(',')
                            });

                        }
                        self._lastEvalKey = data.LastEvaluatedKey;
                        paperDefer.resolve(papers);
                    }
                });

                return paperDefer.promise;
            },

            // Get papers and all their attributes by Ids
            getBatchPaper: function(Ids) {
                var batchPaperDefer = $q.defer();
                var papers = [];
                var dynamodb = new AWS.DynamoDB();
                 
                var batchParams = {
                    RequestItems:
                    {
                        Paper: {
                            AttributesToGet: ['Id','Authors','Link', 'Title'],
                            Keys: []
                        }
                    }
                };

                for(var i = 0; i < Ids.length; i++){
                    batchParams.RequestItems.Paper.Keys.push({"Id": {"S": Ids[i]}});
                }

                dynamodb.batchGetItem(batchParams, function(err, data) { 
                    if (err) { 
                        console.log(err, err.stack);
                        batchPaperDefer.reject('Cannot query Paper table');
                    } else{
                        for (var i = 0; i < data.Responses.Paper.length; i++) {
                            papers.push({ 
                                Id: data.Responses.Paper[i].Id.S,
                                Authors: (data.Responses.Paper[i].Authors.S).split(','),
                                Link: data.Responses.Paper[i].Link.S,
                                Title: data.Responses.Paper[i].Title.S});
                        }
                        batchPaperDefer.resolve(papers);
                    }
                });

                return batchPaperDefer.promise;
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
                        batchUserDefer.reject('Cannot query User table');
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
                    params: { TableName: 'Recommendation_Likes' }
                });
                // Used for the hashkey in the table
                var key = {
                        "User": { "S": username },
                        "Context": { "S": 'GeneralThread' }
                };
             
                var addAttr;
                var removeAttr;
                if (liked) {
                    addAttr = "Likes";
                    removeAttr = "Dislikes";
                } else {
                    addAttr = "Dislikes";
                    removeAttr = "Likes";
                }

                // Update the SS for the add column(attribute)
                var updateAdd = {
                    Key: key,
                    AttributeUpdates: {}
                };
                updateAdd.AttributeUpdates[addAttr] = {
                    "Action": "ADD",
                    "Value": { "SS": [paperId] }
                }

                // Update the SS for the remove column(attribute)
                var updateRemove = {
                    Key: key,
                    AttributeUpdates: {}
                };
                updateRemove.AttributeUpdates[removeAttr] = {
                    "Action": "DELETE",
                    "Value": { "SS": [paperId] }
                }

                // Removes paperId from removeAttr SS if dynamo finds it.
                recLikesTable.updateItem(updateRemove, function(err, data){
                    if(err)
                        console.log(err);
                });

                // Adds paperId to opposite SS
                recLikesTable.updateItem(updateAdd, function(err, data) {
                    if(err)
                        console.log(err);
                });
            }, // end of dynamoPref
            getDynamoPref: function(username) {
                var defered = $q.defer();

                var prefTable = new AWS.DynamoDB({
                    params: {
                        TableName: 'Recommendation_Likes'
                    }
                });

                var getParams = {
                    Key: {
                        "User": {
                            "S": username
                        },
                        "Context": {
                            "S": 'GeneralThread'
                        }
                    }
                }
                
                prefTable.getItem(getParams, function(err, data){
                    if(err)
                        console.log(err);
                    else
                        defered.resolve(data);
                });

                return defered.promise;
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

