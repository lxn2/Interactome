'use strict';

// UserService is responsible to holding onto the authenticated user. The userservice will 
// handle to bulk of AWS interactions from the perspective of "user interacting with AWS". 
// This perspective could also allow us to keep track of user "likes" for future rec system. 

angular.module('interactomeApp.Userservice', [])


// Used a servie type: factory instead of a pure service, because how I understand it
// factories allow more controlled access: can decide what to return instead of returning the entire service itself.
// Not too much of a difference really, still learning....
.factory('UserService', function($q, $http, AwsService) {
    var service = {
        _user: null,
        Bucket: 'sagebionetworks-interactome-abstracts',
        setCurrentUser: function(u) {
            if (u && !u.error) {
                service._user = u;
                AwsService.setToken(u.id_token);

                return service.currentUser();

            } else {
                // If google authentication has error the promise is defered and rejected, 
                // think of this as throwing an error in Javascript. 
                var d = $q.defer();
                d.reject(u.error);
                return d.promise;
            }
        },
        currentUser: function() {
            var d = $q.defer();
            d.resolve(service._user);
            return d.promise;

        }



    };
    return service;
});

//Yo build came with this, commented it out.

/*
    .service('Userservice', function Userservice() {
        // AngularJS will instantiate a singleton by calling "new" on this function

        return service;
    });
*/