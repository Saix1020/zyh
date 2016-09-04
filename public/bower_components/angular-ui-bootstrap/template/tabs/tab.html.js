angular.module("uib/template/tabs/tab.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("uib/template/tabs/tab.html",
    "<li ng-class=\"{active: active, disabled: disabled}\" class=\"uib-tab\">\n" +
    "  <div ng-click=\"select()\" uib-tab-heading-transclude>{{heading}}</div>\n" +
    "</li>\n" +
    "");
}]);
