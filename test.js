var request = require('superagent');
var cheerio = require('cheerio');
var agent = request.agent();
var utils = {
	'joinparam' : function(dict){
		var str = [];
		for(var key in dict){
			str.push(key + "=" + encodeURIComponent(dict[key]));
		}
		return str.join("&");
	},
	'expandURL': function(url){
		/**
		*   https://aa.com/?a=1&b=2
		*   expands to {"a": 1, "b": 2}
		*/
		var m = url.split("?")[1].split("&");
		var dict = {};
		for(var i in m){
			var pair = m[i].split("=");
			dict[pair[0]] = pair[1];
		}
		return dict;
	}
}

function getEndpoint(type){
	// /.well-known/oada-configuration 
	var Am = {
		"authorization_endpoint": "https://provider.oada-dev.com/auth",
		"token_endpoint": "https://provider.oada-dev.com/token",
		"oada_base_uri": "https://provider.oada-dev.com",
		"client_secret_alg_supported": [
			"RS256"
			]
		}
	return Am[type];
}

function determineURL(current_url, form_action){
    var base = getEndpoint("oada_base_uri");
    var url = current_url + "/" + form_action;
    if(form_action[0] == "/"){
    	url = form_action.replace(/^\//, base + "/");
    }
    return url;
}


function tryGetToken() {
    var base = getEndpoint("oada_base_uri");

    agent
	.post("https://provider.oada-dev.com/login")
    .type('form') 
    .set('User-Agent','Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0')
	.send({username: "frank", password: "pass"})
	.end(didLogin);

}

function getAccessCode(){
	var auth_base = getEndpoint("authorization_endpoint");
    var param = {
    	"response_type" : "code",
    	"client_id": "3klaxu838akahf38acucaix73@identity.oada-dev.com",
    	"state" : "xyz",
    	"redirect_uri": "https://client.oada-dev.com/redirect",
    	"scope": "bookmarks.fields"
    }
    var auth_url = auth_base + "/" + "?" + utils.joinparam(param);
    // console.log(auth_url);

   	// var req = request.get(auth_url);
   	// agent.attachCookies(req);
   	// req.end(didGetAccessCode);
   	agent
   	.get(auth_url)
   	.end(didGetGrantScreen);
}

function getTokenWithCode(code){

}


function didGetGrantScreen(err, res){
	if(err){
		throw err;
	}
	var cur_path = res.request.url.split("?")[0];
	//TODO: here we can check for 'Privacy and Data Use Principles '
	//TODO: we can also check for 'registered with a trusted provider. '
	//TODO: and check for 'requesting access to' list

	var data = {};
	//parse form
	$ = cheerio.load(res.text);
	var form = $("form");
	var form_action = $("form").attr("action");
	var post_url = determineURL(cur_path, form_action);
	console.log("Will post to " + post_url);
	$("form input[type=text], input[type=password], input[type=hidden], textarea").each(function(m,t){
		data[$(this).attr("name")] = $(this).attr("value");
	});
	console.log(data);
	
	agent
	.post(post_url)
    .type('form') 
     .set('User-Agent','Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0')
 	.send(data)
	.end(didGrantPermission);

}

function didGrantPermission(err, res){
	var qrystr = utils.expandURL(res.request.url);
	console.log(qrystr);
	getTokenWithCode(qrystr.code);
}

function didLogin(err,res){
	if(err){
		throw err;
	}
	agent.saveCookies(res);
	getAccessCode();
}

tryGetToken();

