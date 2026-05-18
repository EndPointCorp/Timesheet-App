'use strict';

angular.module('angularApp')
  .directive('selectButton',function () {
    return{
      restrict: 'AE',
      replace: true,
      scope: {
        buttonItems: "=",
        addedItems: "=",
        isChange: "=",
        selectedButton: "=",
        isDefaultItem: "="
      },
      templateUrl: 'views/_selectButtons.html',
      link: function (scope, element, attrs) {
        var allItems = [];

        scope.$watch('isChange', function () {
          scope.updateItems("");
        });

        scope.selectItem = function (buttonItem) {
          scope.updateItems(buttonItem);
          scope.selectedButton = buttonItem;
        };

        scope.updateItems = function (buttonItem) {
          if (scope.addedItems) {
            var filtered = Lazy(scope.addedItems).map(function(item) {
              return item.id;
            }).toArray();

            if (buttonItem) {
              filtered.push(buttonItem.id);
            }

            scope.buttonItems = Lazy(allItems).filter(function (item) {
              return filtered.indexOf(item.id) < 0;
            }).toArray();
          }
        };

        scope.isSelectedReport = function (buttonItem) {
          return scope.selectedButton === buttonItem;
        };

        scope.fillButtons = function (items) {
          if(items === null || items === undefined) {
            return;
          }
          if (items.length > 0 && allItems.length === 0) {
            allItems = items;

            if (scope.isDefaultItem) {
              allItems.forEach(function (item) {
                if (item.active) {
                  scope.selectedButton = item;
                }
              });
            }
          }
        };

        scope.$watch(function () {
          return scope.buttonItems;
        }, function (newVal) {
          scope.fillButtons(newVal);
        }, true);

        scope.fillButtons(scope.buttonItems);
      }
    }
  });
