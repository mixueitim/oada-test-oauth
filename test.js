var request = require('superagent');
var cheerio = require('cheerio');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var agent = request.agent();

var wellknown_doc = null;
var wellknown_prov = null;

var IDENTITY_PROVIDER = "https://identity.oada-dev.com";
var OADA_PROVIDER = "https://provider.oada-dev.com";
var CLIENT_ID = "3klaxu838akahf38acucaix73@identity.oada-dev.com";
var CLIENT_ACCEPT_URI = "https://client.oada-dev.com/redirect";
var DISCOVERY_URI = "https://identity.oada-dev.com/clientDiscovery?clientId=" + CLIENT_ID;

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

function init(cb){
	var url = IDENTITY_PROVIDER + "/.well-known/oada-configuration"
	request.get(url).end(function(e,res){
		try{
			wellknown_doc = JSON.parse(res.text);
			var url2 = OADA_PROVIDER + "/.well-known/oada-configuration"
			request.get(url2).end(function(e,res){
				try{
					wellknown_prov = JSON.parse(res.text);
					cb();
				}catch(e){
					throw ".well-known document cannot be parsed"
				}
			});

		}catch(e){
			throw ".well-known document cannot be parsed"
		}
	});
	
}

function determineURL(current_url, form_action){
    var url = current_url + "/" + form_action;
    if(form_action[0] == "/"){
    	url = form_action.replace(/^\//, IDENTITY_PROVIDER + "/");
    }
    return url;
}


function beginObtainTokenProcess() {
    tryLogin();
}

function tryLogin(){
	var fullurl = IDENTITY_PROVIDER + "/login";

	agent
	.post(fullurl)
    .type('form') 
    .set('User-Agent','Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0')
	.send({username: "andy", password: "pass"})
	.end(didLogin);
}

function getAccessCode(){
	var auth_base = wellknown_doc["authorization_endpoint"];
    var param = {
    	"response_type" : "code",
    	"client_id": CLIENT_ID,
    	"state" : "xyz",
    	"redirect_uri": CLIENT_ACCEPT_URI,
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

function generateClientSecret(key, issuer, audience, accessCode){
	var sec = {
		ac : accessCode
	}

	var options = {
		algorithm: 'RS256',
		audience: audience,
		issuer: issuer
	}

	return jwt.sign(sec, key, options);
}

/**
*  exchange code for token, 
*  - make request to token endpoint 
*/
function getTokenWithCode(ac){
	var token_endpoint = wellknown_prov["token_endpoint"];
	var cert = fs.readFileSync('certs/private.pem');

	// console.log(token_endpoint);

	var secret = generateClientSecret(
			cert,
			CLIENT_ID,
			token_endpoint,
			ac
		);

	var post_param = {
		"grant_type": "authorization_code",
		"code": ac,
		"redirect_uri": CLIENT_ACCEPT_URI,
		"client_id": CLIENT_ID,
		"client_secret": secret
	}

	console.log(post_param);

	agent
	.post(token_endpoint)
    .type('form') 
     .set('User-Agent','Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0')
 	.send(post_param)
	.end(didGetToken);
}

function didGetToken(err,res){
	if(err){
		throw err;
	}
	console.log(res.text);
}

init(beginObtainTokenProcess);