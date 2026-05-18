angular.module('ngRolesFilter', []).filter('orderRolesBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(value, key) {
      filtered.push([key, value]);
    });
    filtered.sort(function (a, b) {
      return (a[1].id[field] > b[1].id[field] ? 1 : -1);
    });
    if(reverse) filtered.reverse();
    var result = {};
    angular.forEach(filtered, function(item) {
      result[item[0]] = item[1];
    });
    return result;
  };
}).filter('searchByField', function() {
  return function(items, field, searchString) {
        var result = {};
        angular.forEach(items, function(value, key) {
          if (value[field].toLowerCase().indexOf(searchString.toLowerCase()) >= 0) {
              result[key] = value;
          }
        });
        return result;
    };
}).filter('filterByRole', function() {
  return function(items, field, searchString) {
        if(searchString) {
          var result = [];
          Lazy(items).each(function(item) {
            var isExist = false;
            Lazy(item[field]).each(function(subItem) {
              if (subItem['display_label'] == searchString || subItem['label'] == searchString) {
                isExist = true;
              }
            });
            if(isExist === true) {
              result.push(item);
            }
          });
          return result;
        }
        return items;
    };
}).filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});
