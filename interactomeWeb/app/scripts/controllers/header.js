'use strict';


/*
    Controls the elements in the header (search bar, sign in).
*/
angular.module('interactomeApp')
.controller('HeaderCtrl', function($scope, $location, UserService, AwsService) {
    
    $scope.userTopics = [];
    $scope.newTopic = null;
    // This function sets the user authentication from googleSignin directive. 
    $scope.signedIn = function(oauth) {
        // Google authentication passed into userService to hold onto and track user.
        UserService.setCurrentOAuthUser(oauth).then(function(user) {
                $scope.user = user;
            });
    };

    $scope.searchSubmit = function() {
        if ($scope.searchByText && $scope.searchByText.length > 0) {
            var url = "/searchView";
            $location.search('search', $scope.searchByText).path(url);
        }
    };

    // Setup AWS resources
    AwsService.credentials().then(function() {
        AwsService.getTopics(UserService.currentUsername()).then(function(topics) {
            $scope.userTopics.length = 0;
            $scope.userTopics.push.apply($scope.userTopics, topics);
        }, function(reason) {
            alert(reason);
        });
    });

    $scope.addTopic = function() {
        var username = UserService.currentUsername();
        var newTopic = {Name: $scope.newTopic};
        var scope = $scope;
        if($scope.newTopic == "" || $scope.newTopic === null) {
            alert("Topic name must not be empty");
        }
        else{
            AwsService.addTopic(username, $scope.newTopic).then(
                function(topicId) {
                    newTopic.Id = topicId;
                    scope.userTopics.push(newTopic);
                    scope.userTopics.sort(function(a,b) {
                        return (a['Name'].localeCompare(b['Name'], 'kn', {numeric: true, caseFirst: "lower", usage: "sort"}) >= 0);
                    });
                }, 
                function(reason) {
                    alert(reason);
                }
            );
        }
        // reset to null
        $scope.newTopic = null;
    };

    $scope.hasTopicName = function(topicname) {
        var returnVal = true;
        var i = 0;
        var curLength = $scope.userTopics.length;
        while(i < curLength) { // find the correct element
            if ($scope.userTopics[i].Name == topicname) {
                break;
            }
            else{
                i++;
            }
        }
        if (i < curLength) {// return true if element found
            returnVal = true;
        }
        else {
            returnVal = false;
        }
        return returnVal;
    };

    $scope.renameTopic = function(topicid, topicname) {
        var i = 0;
        var curLength = $scope.userTopics.length;
        while(i < curLength) { // find the correct element
            if ($scope.userTopics[i].Id == topicid) {
                break;
            }
            else{
                i++;
            }
        }
        if (i < curLength) {// delete element if found
            $scope.userTopics[i].Name = topicname;
        }
    };

    $scope.deleteTopic = function(topicid) {
        var i = 0;
        var curLength = $scope.userTopics.length;
        while(i < curLength) { // find the correct element
            if ($scope.userTopics[i].Id == topicid) {
                break;
            }
            else{
                i++;
            }
        }
        if (i < curLength) {// delete element if found
            $scope.userTopics.splice(i, 1);
        }
    };

    $scope.getRecs = function(paperslist) {
        $scope.$broadcast('getRecsFromTopic', paperslist);
    };
});
