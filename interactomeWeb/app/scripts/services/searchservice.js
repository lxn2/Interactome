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
		            "qt": "edismax",
		            "qf": "title text",
		            "hl": true,
		            "wt": "json",
		            "rows":1000
		        },
		        traditional: true,
		        cache: true,
		        async: true,
		        dataType: 'jsonp',
		        jsonp: 'json.wrf',
            });
            console.log("thenning");
            request.done(function(response) {
            	console.log(response);
            	deferred.resolve(response.response.docs);
            });
            request.fail(function(response) {
            	if (!angular.isObject( response.data ) || ! response.data.message)
	            	deferred.reject( "An unknown error occurred.");
	            else
            		deferred.reject( response.data.message )
            });
    	    //request.then(service.handleSuccess, service.handleError);

			return deferred.promise;
	    },

	    // I transform the error response, unwrapping the application dta from
	    // the API response payload.
	    handleError: function(response, deferred) {

	        // The API response from the server should be returned in a
	        // nomralized format. However, if the request was not handled by the
	        // server (or what not handles properly - ex. server error), then we
	        // may have to normalize it on our end, as best we can.
	        if (
	            ! angular.isObject( response.data ) ||
	            ! response.data.message
	            ) {

	            deferred.reject( "An unknown error occurred.");

	        } else {
	        // Otherwise, use expected error message.
	        	deferred.reject( response.data.message );
	    	}
	    },


	    // I transform the successful response, unwrapping the application data
	    // from the API response payload.
	    handleSuccess: function(response, deferred) {
	        deferred.resolve();
	    }

	};

	return service;
})
	 

