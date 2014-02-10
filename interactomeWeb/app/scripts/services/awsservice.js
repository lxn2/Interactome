'use strict';

angular.module('interactomeApp.Awsservice', [])


// creating service type provider. Provider used to configure service before app runs. 
.provider('Awsservice', function() {
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
        // cacheFactory service enables us to create an object/data if we need it and recycle
        // or reuse and object/data if already needed in past. Improved latency 

        var s3Cache = $cacheFactory('s3Cache');
        var dynamoCache = $cacheFactory('dynamo');
        var snsCache = $cacheFactory('sns');
        var sqsCache = $cacheFactory('sqs');

        var credentialsDefer = $q.defer();
        var credentialsPromise = credentialsDefer.promise;

        return {
            credentials: function() {
                return credentialsPromise;
            },
            setToken: function(token, providerId) {
                var config = {
                    RoleArn: self.arn,
                    WebIdentityToken: token,
                    RoleSessionName: 'sage-app'
                }
                if (providerId) {
                    config['ProviderId'] = providerId;
                }
                self.config = config;
                AWS.config.credentials =
                    new AWS.WebIdentityCredentials(config);
                credentialsDefer
                    .resolve(AWS.config.credentials);
            }

        }
    }
});
/* Yo build came with this, commented it out. 
.service('Awsservice', function Awsservice() {
    // AngularJS will instantiate a singleton by calling "new" on this function
});
*/