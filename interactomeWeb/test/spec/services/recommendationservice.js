'use strict';

describe('Service: Recommendationservice', function () {

  // load the service's module
  beforeEach(module('interactomeApp'));

  // instantiate service
  var Recommendationservice;
  beforeEach(inject(function (_Recommendationservice_) {
    Recommendationservice = _Recommendationservice_;
  }));

  it('should do something', function () {
    expect(!!Recommendationservice).toBe(true);
  });

});
