'use strict';

describe('Directive: mainscreen', function () {

  // load the directive's module
  beforeEach(module('studygroupClientApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<mainscreen></mainscreen>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the mainscreen directive');
  }));
});
