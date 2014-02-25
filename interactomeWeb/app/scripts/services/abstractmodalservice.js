'use strict';

// http://jsfiddle.net/XqDxG/550/
// This service handles broadcasting new selections of abstracts for viewing
// Contains the new selection's abstract, title, and author info
// In the Angular context, this approach is better than calling a controller function while out of scope
// since supposedly the Angular philosophy doesn't support mixing of DOM and Angular code.
angular.module('interactomeApp.Abstractmodalservice', [])
.service('Abstractmodalservice', function($rootScope) {
    var sharedService = {};
    
    sharedService.abText = '';
    sharedService.abTitle = '';
    sharedService.lastName = '';
    sharedService.firstName = '';

    sharedService.prepForBroadcast = function(abTitle,firstName,lastName,abText) {
        this.abText = abText;
        this.abTitle = abTitle;
        this.lastName = lastName;
        this.firstName = firstName;
        this.broadcastItem();
    };

    sharedService.broadcastItem = function() {
        $rootScope.$broadcast('handleAbstractModalBroadcast');
    };

    return sharedService;
});