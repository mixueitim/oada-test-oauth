var utils = {
	'expand_param' : function(dict){
		var str = [];
		for(var key in dict){
			str.push(key + "=" + encodeURIComponent(dict[key]));
		}
		return str.join("&");
	}
}

function getEndpoint(type){
	//for testing purpose
	// /.well-known/oada-configuration 
	var Am = {
		"authorization_endpoint" : "https://provider.oada-dev.com/auth"
	}
	return Am[type];
}

function getAccessCode() {
    var auth = getAuthorizationEndpoint("authorization_endpoint");
    var param = {
    	"response_type" : "code",
    	"client_id": "3klaxu838akahf38acucaix73@identity.oada-dev.com",
    	"state" : "xyz",
    	"redirect_uri": "https://client.oada-dev.com/redirect",
    	"scope": "bookmarks.fields"
    }
    var url = auth + "/" + "?" + utils.expand_param(param);

    /* call this URL */

    /* get the HTML and we can reconstruct a POST request to /decision */


}
