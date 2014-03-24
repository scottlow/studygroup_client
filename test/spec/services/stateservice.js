'use strict';

describe('Service: Stateservice', function () {

  // load the service's module
  beforeEach(module('studygroupClientApp'));

  // instantiate service
  var Stateservice;
  beforeEach(inject(function (_Stateservice_) {
    Stateservice = _Stateservice_;
  }));

  it('should do something', function () {
    expect(!!Stateservice).toBe(true);
  });

});
