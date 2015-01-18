var request = require('superagent');
var cheerio = require('cheerio');
var clisec = require('client_secret');

var agent = request.agent();
var domain = "https://identity.oada-dev.com";
var wellknown_doc = null;

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

function init(){
	var url = domain + "/.well-known/oada-configuration"
	request.get(url).end(function(e,res){
		try{
			wellknown_doc = JSON.parse(res.text);
		}catch(e){
			throw ".well-known document cannot be parsed"
		}
	});
}

function getEndpoint(type){
	if(wellknown_doc === null) {
		throw "Try doing init()"
	}
	return wellknown_doc[type];
}

function determineURL(current_url, form_action){
    var url = current_url + "/" + form_action;
    if(form_action[0] == "/"){
    	url = form_action.replace(/^\//, domain + "/");
    }
    return url;
}


function beginObtainTokenProcess() {
    tryLogin();
}

function tryLogin(){
	var fullurl = domain + "/login";

	agent
	.post(fullurl)
    .type('form') 
    .set('User-Agent','Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0')
	.send({username: "andy", password: "pass"})
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

/**
*  in order to exchange code for token, 
*  we need to make request to token endpoint with 
*  signed client_secret, grant_type, code, redirect_uri, client_id 
*/
function getToken(){
	//client secret must validate against "public key from client registration document" (?)

    //Generate Client Secret (which only should be known by provider and client)

    //JWS
    //typ = Type
    //alg = Algorithm
    //kid = Key Id (?)
    var cs_header = {
	  "typ": "JWT",
	  "alg": "RS256",
	  "kid": "nc63dhaSdd82w32udx6v"
	}

	//TODO: How to obtain `kid`


	//JWT
	//ac = Access code
	//iat = Issued At
	//aud = Audience
	//iss = issuer
	var cs_payload = {
	  "ac": "Pi2dY-FBxZqLx81lTbDM4WGlI",
	  "iat": 1418421102,
	  "aud": "https://provider.oada-dev.com/token",
	  "iss": "3klaxu838akahf38acucaix73@identity.oada-dev.com"
	}

	//JWK ?
	//TODO: not sure about this part
	//kty = Key Type
	//use = Public Key Use
	//alg = Algorithm
	//kid = Key Id (base64)
	//n = Modulus (base64)   - ---? 
	//e = Public Exponent (base64) ---- ?
	var pubkey = {
	  "kty": "RSA",
	  "use": "sig",
	  "alg": "RS256",
	  "kid": "nc63dhaSdd82w32udx6v",
	  "n": "AKj8uuRIHMaq-EJVf2d1QoB1DSvFvYQ3Xa1gvVxaXgxDiF9-Dh7bO5f0VotrYD05MqvY9X_zxF_ioceCh3_rwjNFVRxNnnIfGx8ooOO-1f4SZkHE-mbhFOe0WFXJqt5PPSL5ZRYbmZKGUrQWvRRy_KwBHZDzD51b0-rCjlqiFh6N",
	  "e": "AQAB"
	}

	// var hash_header = 

}

init();
beginObtainTokenProcess();
