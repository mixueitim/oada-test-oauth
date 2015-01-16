/**
 * Handles generation of JWT client secret.
 * - Sign using client_secret_alg_supported or RSA 256
 * - `ac` key = access code
 */

var jwt = require('jsonwebtoken');

/*

	Generate Client Secret
	adapted from OADA/oada-id-client-js/src/core.js

*/
function generateClientSecret(key, issuer, audience, accessCode) {
    var sec = {
        ac: accessCode,
    };
    var options = {
        algorithm: 'RS256',
        audience: audience,
        issuer: issuer,
    };

    return jwt.sign(sec, key, options);
}


module.exports = {
  'generate': function(){

  },
  'sign': function (){
  	  
  }
}
