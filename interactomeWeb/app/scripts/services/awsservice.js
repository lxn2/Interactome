'use strict';
/**
    This service handles the AWS resources. Setting or getting, should be through this API.

    I decided to use an observer pattern for notifying subscribers instead of $watch and $digest. I couldn't seem to get them to bind correctly
    when trying to use the mainCtrl. The observer pattern is slightly more wordy
**/
angular.module('interactomeApp.Awsservice', [])


// creating service type provider. Provider used to configure service before app runs.
.provider('AwsService', function() {
    var self = this;
    self.abstractURLIds = []
    AWS.config.region = 'us-west-2';
    self.arn = null;

    self.setArn = function(arn) {
        if (arn) self.arn = arn;
    }

    self.setRegion = function(region) {
        if (region) AWS.config.region = region;
    }


    self.$get = function($q, $cacheFactory, $http, $rootScope) {
        var credentialsDefer = $q.defer();
        var credentialsPromise = credentialsDefer.promise;
        var _s3Subscribers = [];
        var _SNSTopics = {};
        return {
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
                AWS.config.credentials =
                    new AWS.WebIdentityCredentials(config);
                credentialsDefer
                    .resolve(AWS.config.credentials);

                // Refactor Warning: this should probably just be an event that is broadcasted letting subscribers know that credentials have been loaded.
                this.getS3Targets();

            }, // end of setToken func 

            subscribeToS3: function (cb) {
                _s3Subscribers.push(cb);
            },

            /**
                This will eventually change once we get the recmod up and going (it will feed how we get abstracts).
                I believe it is also bad form to manipulate the dom from inside of a service.
                However, this fits our needs for now.
            **/
            getS3Targets: function() {
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
                        self.abstractURLIds.length = 0;
                        for (var i = 0; i < 10; i++) {
                            self.abstractURLIds.push({id:data.Contents[i].Key});
                        }
                        // Let all the subscribers know about new abstracts
                        angular.forEach(_s3Subscribers, function (cb) {
                            cb(self.abstractURLIds);
                        });

                        $rootScope.$broadcast('s3Abstracts@AwsService');

                    }
                });
            },

            test: function() {return self.abstractURLIds},

            postMessageToSNS: function (topicArn, msg) {
                if(!topicArn || !msg) {
                    console.log("postMessageToSNS param error. topicArn: " + topicArn + " msg: " + msg);
                    return;
                }

                // We store the SNS on first topic usage to avoid multiple instantiations
                var sns = _SNSTopics[topicArn]; 
                if (sns == undefined) {
                    console.log("undefined");
                    sns = new AWS.SNS({params: {TopicArn: topicArn}});
                    _SNSTopics[topicArn] = sns;
                }

                sns.publish({Message: msg}, function (err, data) {
                    // if (!err) console.log(publishedmsg);
                });
                
            },



        } // end of return 
    }
});
