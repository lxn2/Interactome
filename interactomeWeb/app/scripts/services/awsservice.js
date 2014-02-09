'use strict';

angular.module('interactomeApp.Awsservice', [])

.provider('Awsservice', function() {
    var self = this;
    self.arn = null;

    self.setArn = function(arn) {
        if (arn) self.arn = arn;
    }

    self.$get = function($q) {
        var credentialsDefer = $q.defer(),
            credentialsPromise = credentialsDefer.promise;

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