'use strict';

describe('Service: Searchservice', function () {

  // load the service's module
  beforeEach(module('interactomeApp'));

  // instantiate service
  var Searchservice;
  beforeEach(inject(function (_Searchservice_) {
    Searchservice = _Searchservice_;
  }));

  it('should do something', function () {
    expect(!!Searchservice).toBe(true);
  });

});
