'use strict';

angular.module('interactomeApp.SearchService', [])
  .service('SearchService', function SearchService($http, $q) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var service = {
	    getResults: function(query) {
    	    var request = $http({
		        url: "http://ec2-54-201-190-162.us-west-2.compute.amazonaws.com:8983/solr/select",
		        data: {
		            "q": "query",
		            "qt": "edismax",
		            "qf": "title",
		            "hl": true,
		            "wt": "json",
		            "rows":100
		        },
		        traditional: true,
		        cache: true,
		        async: true,
		        dataType: 'jsonp'
		    });

			return (request.then(service.handleSuccess, service.handleError));
	    },

	    // I transform the error response, unwrapping the application dta from
	    // the API response payload.
	    handleError: function(response) {

	        // The API response from the server should be returned in a
	        // nomralized format. However, if the request was not handled by the
	        // server (or what not handles properly - ex. server error), then we
	        // may have to normalize it on our end, as best we can.
	        if (
	            ! angular.isObject( response.data ) ||
	            ! response.data.message
	            ) {

	            return($q.reject( "An unknown error occurred."));

	        }
	        // Otherwise, use expected error message.
	        return( $q.reject( response.data.message ) );

	    },


	    // I transform the successful response, unwrapping the application data
	    // from the API response payload.
	    handleSuccess: function(response) {

	        return(response.data.docs);

	    }
	};

	return service;
})
	 

