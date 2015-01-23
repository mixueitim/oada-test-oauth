var assert = require("assert")
var request = require('supertest');
request = request('https://identity.oada-dev.com');

describe('GET oada-configuration', function(){
  it('respond with oada-configuration document', function(done){
    request
      .get('/.well-known/oada-configuration')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  })
})