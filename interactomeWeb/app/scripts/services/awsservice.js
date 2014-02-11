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


    self.$get = function($q, $cacheFactory, $http) {
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
                            var abstractID = data.Contents[i].Key;
                            $http.get("https://s3-us-west-2.amazonaws.com/sagebionetworks-interactome-abstracts/" + abstractID).then(function(result, abstractID) {
                                document.getElementById('objects').innerHTML +=
                                    '<li class="list-group-item">' +
                                    '<button type="button" class="btn btn-default btn-xs" onclick="abstractLiked()"><span class="glyphicon glyphicon-thumbs-up"></span></button>' +
                                    '<h4 class="list-group-item-heading">' + result.data.AbstractTitle + '</h4>' +
                                    '<input type="checkbox" class="pull-right abstractChck" value="i">' +
                                    '<p class="list-group-item-text">' + "Author: " + (result.data.FirstName[0] + ". " + result.data.LastName) + '</p>'
                                    + '</li>';
                                    console.log(abstractID);
                            })
                            
                        }

                    }
                });


            }, // end of setToken func 

        } // end of return 
    }
});
