'use strict';

angular.module('angularApp')
  .factory('calendar', function($http, currentUser){
    var service = {
      monthNames: [ "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December" ],
      weekDays: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ]
    };
    service.dateRange = function(from, to) {
      if(from > to) return;

      var i = 0;
      return Lazy.repeat(from).map(function(date){
        var d = new Date(date);
        d.setDate(date.getDate() + i);
        i++;
        return d;
      }).takeWhile(function(date){
        return date <= to;
      }).toArray();
    };
    service.getDays = function(year, month, username){
      if (typeof username === 'undefined' || username === null) {
        var q = $http.get("/work_days/calendar/" + year + "/" + month + ".json");
      } else {
        var q = $http.get("/work_days/calendar/" + year + "/" + month + "/" + username + ".json");
      }

      return q;
    };
    service.cachedDays = function(year, month){
      if(currentUser.user === null || currentUser.user === undefined){
        return [];
      }
      if(!localStorage.hasOwnProperty('calendarMonths')) return [];
      return localStorage['calendarMonths' + year + "-" + month + "-" + currentUser.user.as];
    };
    var yyyymmdd = function(date){
      var yyyy = date.getFullYear().toString();                                    
      var mm = (date.getMonth()+1).toString(); // getMonth() is zero-based         
      var dd  = date.getDate().toString();             
      return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
    };
    var monthsAgo = function(date, ago){
      var d = new Date(date.getFullYear(), date.getMonth(), 1);
      Lazy.range(ago).each(function(i){
        d.setDate(0);
        d.setDate(1);
      });
      return d;
    };
    var monthsTo = function(date, to){
      var d = new Date(date.getFullYear(), date.getMonth(), 1);
      Lazy.range(to).each(function(i){
        d.setDate(32);
        d.setDate(1);
      });
      return d;
    };
    var monthDifference = function(d1, d2){
      return d2.getMonth() - d1.getMonth() + (12 * (d2.getFullYear() - d1.getFullYear()));
    };
    service.getMonthTotals = function(date, username){
      var now = new Date();
      var toDate   = monthsAgo(date, 0);
      var fromDate = monthsAgo(date, 5);
      var from = yyyymmdd(fromDate);
      var to = yyyymmdd(toDate);
      
      if (typeof username === 'undefined' || username === null) {
        var q = $http.get('/work_months/' + from + '/' + to + '.json');
      } else {
        var q = $http.get('/work_months/' + from + '/' + to + '/' + username + '.json');
      }
      
      q.then(function(res){
        Lazy(res.data).map(function(month){
            var m = month;
            m.monthName = service.monthNames[m.month - 1];
            m.availableTotal = m.available / 60;
            m.billableTotal = m.billable_total / 60;
            m.nonbillableTotal = m.nonbillable_total / 60;
            m.ptoTotal = m.pto_total / 60;
            m.overallTotal = m.total / 60;
            m.differenceTotal = m.difference / 60;
            m.candidateCompTime = ((m.availableTotal / 8.0) * 8.75) / 2.0;
            if(m.year == now.getFullYear() && m.month == (now.getMonth() + 1)){
              m.class = "month-current";
            }
            else{
              if(m.differenceTotal < 0){
                m.class = "month-little";
              }
              else{
                m.class = "month-ok";
              }
            }
            return m;
          }).toArray()
      });
      return q;
    };
    service.cachedMonthTotals = function(date){
      return [];
    };
    return service;
  })
