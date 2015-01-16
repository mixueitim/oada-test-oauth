function getEndpoint(type){
	//for testing purpose
	var Am = {
		"authorization_endpoint" : "https://provider.oada-dev.com/auth"
	}
	return Am[type];
}

function expand_param(dict){
	var str = [];
	for(var key in dict){
		str.push(key + "=" + encodeURIComponent(dict[key]));
	}
	return str.join("&");
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
    var url = auth + "/" + "?" + expand_param(param);
}
