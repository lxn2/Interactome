'use strict';

// UserService is responsible to holding onto the authenticated user. The userservice will 
// handle to bulk of AWS interactions from the perspective of "user interacting with AWS". 
// This perspective could also allow us to keep track of user "likes" for future rec system. 

angular.module('interactomeApp.UserService', [])


// Used a service type: factory instead of a pure service, because how I understand it
// factories allow more controlled access: can decide what to return instead of returning the entire service itself.
// Not too much of a difference really, still learning....
.factory('UserService', function($q, $http, AwsService) {
    var service = {
        _user: null,
        _username: "Ball hard 24/7",
        Bucket: 'sagebionetworks-interactome-abstracts',
        setCurrentOAuthUser: function(u) {
            if (u && !u.error) {
                service._user = u;
                AwsService.setToken(u.id_token);

                return service.currentOAuthUser();

            } else {
                // If google authentication has error the promise is defered and rejected, 
                // think of this as throwing an error in Javascript. 
                var d = $q.defer();
                d.reject(u.error);
                return d.promise;
            }
        },
        currentOAuthUser: function() {
            var d = $q.defer();
            d.resolve(service._user);
            return d.promise;

        },

        currentUsername: function () {
            return service._username; 
        }
        
    };
    return service;
});