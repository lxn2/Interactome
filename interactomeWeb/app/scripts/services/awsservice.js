'use strict';

angular.module('interactomeApp.Awsservice', [])


// creating service type provider. Provider used to configure service before app runs. 
.provider('AwsService', function() {
    var self = this;
    AWS.config.region = 'us-west-2';
    self.arn = null;

    self.setArn = function(arn) {
        if (arn) self.arn = arn;
    }

    self.setRegion = function(region) {
        if (region) AWS.config.region = region;
    }


    self.$get = function($q, $cacheFactory) {
        var credentialsDefer = $q.defer();
        var credentialsPromise = credentialsDefer.promise;
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
                        for (var i = 0; i < 10; i++) {
                            document.getElementById('objects').innerHTML +=
                                '<li>' + data.Contents[i].Key + '</li>';
                        }

                    }
                });


            }, // end of setToken func 

        } // end of return 
    }
});
/* Yo build came with this, commented it out. 
.service('Awsservice', function Awsservice() {
    // AngularJS will instantiate a singleton by calling "new" on this function
});
*/