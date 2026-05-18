angular.module('colorCodingFilters', [])
.filter('dailyHours', function() {
  return function(hours, date, now) {
    if(date.toDateString() == now.toDateString()){
      return 'status-today';
    }
    var day = date.getDay();
    var weekend = (day == 0 || day == 6);
    if(date > now && !weekend) {
      return 'status-notyet';
    }
    if(hours >= 8 || (hours > 0 && weekend)){
      return 'status-ok';
    }
    else{
      if(weekend){
        return 'weekend';
      }
      else if(date < now){
        return 'status-little'
      }
    }
  };
})
.filter('totalHours', function() {
  return function(total, desirable_total) {
    if(total < desirable_total) {
      return 'total-little';
    } else {
      return 'total-ok';
    }
  };
});