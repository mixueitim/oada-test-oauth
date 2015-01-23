var request = require('supertest');
var chai = require('chai');
chai.use(require('chai-json-schema'));
var assert = chai.assert;
var should = chai.should();

request = request('https://identity.oada-dev.com');

describe('Pre-requisite .well_known/oada-configuration', function(){
  it('should respond with oada-configuration document', function(done){
    request
      .get('/.well-known/oada-configuration')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err,res){
      	should.not.exist(err);
      	assert.jsonSchema(JSON.parse(res.text), require("./schema/oada_configuration.json"));
      	done()
      });
  });
});

describe('Pre-requisite .well_known/oada-client-discovery', function(){
  it('should respond with oada-client-discovery document', function(done){
    request
      .get('/.well-known/oada-client-discovery')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err,res){
      	should.not.exist(err);
      	assert.jsonSchema(JSON.parse(res.text), require("./schema/oada_client_discovery.json"));
      	done()
      });
  });
});