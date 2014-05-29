'use strict';

angular.module('interactomeApp.SearchService', [])
  .service('SearchService', function SearchService($http, $q) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var service = {
	    getResults: function(query) {
	    	var deferred = $q.defer();
    	    var request = $.ajax({
    	    	url: "http://ec2-54-201-190-162.us-west-2.compute.amazonaws.com:8983/solr/select",
		        data: {
		            "q": query,
		            "defType": "edismax",
		            "qf": "title text lastName firstName institution",
		            "hl": true,
		            "hl.fl": "title,text",
		            "wt": "json",
		            "rows":1000
		        },
		        traditional: true,
		        cache: true,
		        async: true,
		        dataType: 'jsonp',
		        jsonp: 'json.wrf'
            });
            request.done(function(response) {
            	deferred.resolve(response);
            });
            request.fail(function(response) {
            	if (!angular.isObject( response.data ) || ! response.data.message)
	            	deferred.reject( "An unknown error occurred.");
	            else
            		deferred.reject( response.data.message )
            });

			return deferred.promise;
	    }

	};

	return service;
})
	 

