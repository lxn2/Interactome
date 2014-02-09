'use strict';

describe('Service: Awsservice', function () {

  // load the service's module
  beforeEach(module('interactomeApp'));

  // instantiate service
  var Awsservice;
  beforeEach(inject(function (_Awsservice_) {
    Awsservice = _Awsservice_;
  }));

  it('should do something', function () {
    expect(!!Awsservice).toBe(true);
  });

});
