'use strict';

describe('Directive: collapsableAbstractTitles', function () {

  // load the directive's module
  beforeEach(module('interactomeApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<collapsable-abstract-titles></collapsable-abstract-titles>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the collapsableAbstractTitles directive');
  }));
});
