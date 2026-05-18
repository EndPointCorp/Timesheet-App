'use strict';

angular.module('angularApp')
  .controller('DashboardCtrl', [ '$scope', '$location', '$window', '$filter', 'team', 'users', 'calendar', 'currentUser', function($scope, $location, $window, $filter, team, users, calendar, currentUser){
    $scope.teams = [];
    $scope.rawTotals = [];
    $scope.teamTotals = [];
    $scope.users = [];
    $scope.weekDays = calendar.weekDays;

    $scope.now = new Date();

    $scope.$watch('to', function(to){
      if(to){
        $scope.toString = Lazy(to.toDateString().split(" ")).drop().join(" ");
        $scope.from = new Date($scope.to);
        $scope.from.setDate($scope.to.getDate() - 6);
        $scope.pastWeek = to < (new Date());
      }
    }, true);

    $scope.dateInPast = function(date) {
      return date < (new Date());
    };

    $scope.hoursOk = function(day) {
      var wday = day.date.getDay();
      var total = (day.billable + day.nonbillable + day.pto);

      if(wday == 0 || wday == 6) {
        return total > 0;
      }
      else {
        return total >= 8;
      }
    };

    $scope.hoursLittle = function(day) {
      var wday = day.date.getDay();
      var total = (day.billable + day.nonbillable + day.pto);

      if(wday == 0 || wday == 6) {
        return false;
      }
      else {
        var now = new Date();
        now.setHours(0,0,0,0);
        if(day.date < now) {
          return total < 8;
        }
        else {
          return false;
        }
      }
    };

    $scope.weekOk = function(member) {
      var total = (member.total_billable + member.total_nonbillable + member.total_pto);

      return $scope.pastWeek && (total >= 40);
    };

    $scope.weekLittle = function(member) {
      var total = (member.total_billable + member.total_nonbillable + member.total_pto);

      return $scope.pastWeek && total < 40;
    };

    $scope.$watch('from', function(from){
      if(from !== undefined){
        $scope.fromString = Lazy(from.toDateString().split(" ")).drop().join(" ");
        $scope.dates = calendar.dateRange($scope.from, $scope.to);
        $scope.refreshTotals();
      }
    }, true);

    $scope.$watch('selectedTeam', function(team){
      if(team === undefined) return; 

      $scope.filterTeams();
    });

    $scope.openReport = function(user_code, reportEvent){
      var username = user_code.replace(/user_/, '');
      var reportUrl = "/reports?report_type=standard&start="+$scope.formatDate($scope.from)+"&end="+$scope.formatDate($scope.to)+"&work_chart_id=2&roles="+username+"&description=true&show=false";
      if (reportEvent.metaKey || reportEvent.ctrlKey) {
        $window.open("/#"+reportUrl)
      } else {
        $location.url(reportUrl);
      }
    };
    
    $scope.openReportDayLink = function(user_code, reportEvent, day) {
      var username = user_code.replace(/user_/, '');
      var reportUrl = "/#/reports?report_type=standard&start="+$scope.formatDate(day.date)+"&end="+$scope.formatDate(day.date)+"&work_chart_id=2&roles="+username+"&description=true&show=false";

      return reportUrl;
    };
    
    $scope.reportLink = function(user_code, reportEvent){
      var username = user_code.replace(/user_/, '');
      var reportUrl = "/#/reports?report_type=standard&start_date="+$scope.formatDate($scope.from)+"&end_date="+$scope.formatDate($scope.to)+"&work_chart_id=2&roles="+username+"&description=true&show=false";

      return reportUrl;
    };

    /**
     * Return a link to the calendar view with a specific user and date
     * Using the range start date to get a proper date for the calendar view
     * @param  {String} user_code
     * @return {String}
     */
    $scope.calendarLink = function (userCode) {
      var date = new Date($scope.from);
      var username = userCode.replace(/user_/, '');

      return '/#/calendar-user/' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + username;
    };

    $scope.formatDate = function(convertDate) {
      return $filter('date')(convertDate, 'yyyy-MM-dd')
    };

    $scope.refreshTotals = function(){
      team.fetchTeamMembersTotals($scope.from, $scope.to).then(function(res){
        $scope.rawTotals = res.data;
        $scope.teamTotals = Lazy($scope.teams).map(function(team){
          var users = Lazy(team.users).map(function(user_name, user_code){
            var days = Lazy($scope.dates).map(function(date){
              var userDay = Lazy($scope.rawTotals).find(function(stat){
                var dateElems = stat.date_performed.replace(/-0+/g, '-').split('-');
                var performed = new Date(dateElems[0], dateElems[1] - 1, dateElems[2]);

                return stat.code == user_code &&
                  date.getFullYear() == performed.getFullYear() &&
                  date.getMonth() == performed.getMonth() &&
                  date.getDate() == performed.getDate();
              });
              if(userDay){
                return {
                  date: date,
                  billable: (userDay.durations.billable || 0) / 60,
                  nonbillable: (userDay.durations.nonbillable || 0) / 60,
                  pto: (userDay.durations.pto || 0) / 60
                }
              }
              else{
                return {
                  date: date,
                  billable: 0,
                  nonbillable: 0,
                  pto: 0
                };
              }
            }).toArray();
            return {
              code: user_code,
              name: user_name,
              days: days,
              total_billable: Lazy(days).map(function(d){ return d.billable }).sum(),
              total_nonbillable: Lazy(days).map(function(d){ return d.nonbillable }).sum(),
              total_pto: Lazy(days).map(function(d){ return d.pto }).sum()
            }
          }).sortBy(function(u){
            return u.name;
          })
          .toArray();
          return {
            code: team.code,
            name: team.display_label,
            users: users
          }
        }).toArray();
        $scope.filterTeams();
      });
    };

    $scope.previous = function() {
      var newTo = new Date($scope.to);
      newTo.setDate(newTo.getDate() - 7);
      $scope.to = newTo;
    };

    $scope.next = function() {
      var newTo = new Date($scope.to);
      newTo.setDate(newTo.getDate() + 7);
      $scope.to = newTo;
    };

    $scope.filterTeams = function(){
      if($scope.selectedTeam !== "" && $scope.selectedTeam !== undefined && $scope.selectedTeam !== null) {
        $scope.selectedTeamTotals = Lazy($scope.teamTotals).filter(function(team){
          return team.code == $scope.selectedTeam.code;
        }).toArray();
      }
      else{
        $scope.selectedTeamTotals = $scope.teamTotals;
      }
    };

    $scope.to = new Date($scope.now.getFullYear(), $scope.now.getMonth(), $scope.now.getDate() + 6 - $scope.now.getDay());
    team.getTeams()
      .then(function (teams) {
        $scope.teams = teams.data
          .filter(function(t) {
            return Object.keys(t.users).length > 0;
          });
        $scope.teamItems = Lazy($scope.teams)
        .map(function (d) {
          var member = d;
          member.value= member.code;
          return member;
        })
        .sortBy(function (t) {
          return t.label;
        })
        .toArray();
        var currentUserTeam = Lazy(teams.data).find(function(team){
          return _.contains(_.keys(team.managers), currentUser.user.code);
        });
        if(currentUserTeam) {
          $scope.selectedTeam = currentUserTeam;
          $scope.refreshTotals();
        }
      });
  }]);
