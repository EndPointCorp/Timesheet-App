'use strict';

angular.module('angularApp')
  .controller('ReportsCtrl', [
    '$scope',
    '$http',
    '$filter',
    '$window',
    '$q',
    '$timeout',
    '$location',
    '$rootElement',
    '$routeParams',
    'currentUser',
    'gToast',
    'workCharts',
    '$sce',
    'reports',
    '$route',
    'settings',
    function($scope, $http, $filter, $window, $q, $timeout, $location, $rootElement, $routeParams, currentUser, gToast, workCharts, $sce, reports, $route, settings) {

    // Initialisation
    $scope.showPdfIframe = false;
    $scope.isPdfProcessing = false;
    $scope.showDeadCharts = false;
    $scope.showDeadStatus= false;
    $scope.showHoursInTheBank = false;
    $scope.chart = null;
    $scope.notValid = true;
    $scope.isPartial = false;
    $scope.warningMessage = '';
    $scope.warningMessages = [];
    $scope.placeholder = ' ';
    $scope.role= [];
    $scope.allRoles = [];
    $scope.roles = [];
    $scope.showAll = false;
    $scope.isShowAll = true;
    $scope.workChart = undefined;
    $scope.selectedChart = undefined;
    $scope.roletags = [];
    $scope.startDate = '';
    $scope.endDate = '';
    $scope.restrictedUsers = [];
    $scope.selectedDate = "";
    $scope.display_full = false;
    $scope.printable = false;
    $scope.open_in_new = false ;
    $scope.selectedType = "break";
    $scope.reportTitle = "Break";
    $scope.hasNotApprovedEntries = false;
    $scope.reportSubKind = 'continuous';
    $scope.currentPreset = null;
    $scope.presetPreventFetch = false;
    $scope.namePresetName = '';
    $scope.datesRelative = false;
    $scope.datesRelativeDisabled = true;
    $scope.presets = [];

    $scope.reportTypes = [
      {
        value:  "break",
        label:  "Break",
        active: true
      },
      {
        value:  "billing_at_leaf",
        label:  "Billing at Leaf",
        active: true
      },
      {
        value: "billing",
        label: "Billing",
        active: false
      },
      {
        value: "by_user",
        label: "By user",
        active: false
      },
      {
        value: "standard",
        label: "Standard",
        active: false
      }
    ]

    $scope.now = new Date();
    $scope.current = new Date();
    $scope.y = $scope.current.getFullYear();
    $scope.m = $scope.current.getMonth();
    $scope.d = $scope.current.getDate();
    $scope.beginDay = new Date('2002', '00', '01');
    $scope.firstDay = new Date($scope.y, $scope.m, 1);
    $scope.lastDay = new Date($scope.y, $scope.m + 1, 0);
    $scope.lastMontFirstDay = new Date($scope.y, $scope.m-1, 1);
    $scope.lastMonthLastDay = new Date($scope.y, $scope.m, 0);
    $scope.sevenDayBefore = new Date($scope.y, $scope.m, $scope.d - 7);
    $scope.oneDayBefore = new Date($scope.y, $scope.m, $scope.d - 1);
    $scope.thirtyDayBefore = new Date($scope.y, $scope.m, $scope.d - 30);
    $scope.thisYearFirstDay = new Date($scope.y, 0, 1);
    $scope.lastYearFirstDay = new Date($scope.y - 1, 0, 1);
    $scope.lastYearLastDay = new Date($scope.y, 0, 0);
    $scope.threeSixtyFiveDaysAgo = new Date($scope.y, $scope.m, $scope.d - 365);
    $scope.thisWeekFirstDay = new Date((new Date()).setDate($scope.current.getDate() - $scope.current.getDay()));
    $scope.thisWeekLastDay = new Date($scope.thisWeekFirstDay);
    $scope.thisWeekLastDay.setDate($scope.thisWeekFirstDay.getDate() + 6);
    $scope.lastWeekFirstDay = new Date($scope.thisWeekFirstDay);
    $scope.lastWeekFirstDay.setDate($scope.thisWeekFirstDay.getDate() - 7);
    $scope.lastWeekLastDay = new Date($scope.lastWeekFirstDay);
    $scope.lastWeekLastDay.setDate($scope.lastWeekFirstDay.getDate() + 6);

    $scope.today = $filter('date')($scope.now, 'yyyy/MM/dd') +" - "+ $filter('date')($scope.now, 'yyyy/MM/dd');
    $scope.yesterday = $filter('date')($scope.oneDayBefore, 'yyyy/MM/dd') +" - "+ $filter('date')($scope.oneDayBefore, 'yyyy/MM/dd');
    $scope.lastSevenDays = $filter('date')($scope.sevenDayBefore, 'yyyy/MM/dd') +" - "+ $filter('date')($scope.now, 'yyyy/MM/dd');
    $scope.lastThirtyDays = $filter('date')($scope.thirtyDayBefore, 'yyyy/MM/dd') +" - "+ $filter('date')($scope.now, 'yyyy/MM/dd');
    $scope.thisMonth = $filter('date')($scope.firstDay, 'yyyy/MM/dd') +" - "+ $filter('date')($scope.lastDay, 'yyyy/MM/dd');
    $scope.lastMonth = $filter('date')($scope.lastMontFirstDay, 'yyyy/MM/dd') +" - "+ $filter('date')($scope.lastMonthLastDay, 'yyyy/MM/dd');
    $scope.thisYear = $filter('date')($scope.thisYearFirstDay, 'yyyy/MM/dd') +" - "+ $filter('date')($scope.now, 'yyyy/MM/dd');
    $scope.lastYear = $filter('date')($scope.lastYearFirstDay, 'yyyy/MM/dd') +" - "+ $filter('date')($scope.lastYearLastDay, 'yyyy/MM/dd');
    $scope.lastThreeSixtyFiveDays = $filter('date')($scope.threeSixtyFiveDaysAgo, 'yyyy/MM/dd') +" - "+ $filter('date')($scope.now, 'yyyy/MM/dd');
    $scope.allTime = $filter('date')($scope.beginDay, 'yyyy/MM/dd') +" - "+ $filter('date')($scope.now, 'yyyy/MM/dd');
    $scope.thisWeek = $filter('date')($scope.thisWeekFirstDay, 'yyyy/MM/dd') +" - "+ $filter('date')($scope.thisWeekLastDay, 'yyyy/MM/dd');
    $scope.lastWeek = $filter('date')($scope.lastWeekFirstDay, 'yyyy/MM/dd') +" - "+ $filter('date')($scope.lastWeekLastDay, 'yyyy/MM/dd');

    $scope.allDateRanges = [
        { "name": "Today", "id": $scope.today },
        { "name": "Yesterday", "id": $scope.yesterday },
        { "name": "Last 7 Days", "id": $scope.lastSevenDays },
        { "name": "This Week", "id": $scope.thisWeek },
        { "name": "Last Week", "id": $scope.lastWeek },
        { "name": "Last 30 Days", "id": $scope.lastThirtyDays },
        { "name": "This Month", "id": $scope.thisMonth },
        { "name": "Last Month", "id": $scope.lastMonth },
        { "name": "Last Year", "id": $scope.lastYear },
        { "name": "This Year", "id": $scope.thisYear },
        { "name": "Last 365 Days", "id": $scope.lastThreeSixtyFiveDays },
        { "name": "All Time", "id": $scope.allTime }
    ];

    // Functions
    $scope.selectType = function(item){
      Lazy($scope.reportTypes).each(function(r){
        r.active = r.value === item.value;
        if (r.active){
          $scope.selectedType = item.value;
          $scope.reportTitle = item.label;
        }
      });

      $scope.reportSubKind = 'continuous';
    };

    $scope.setReportTitle = function (){
      $scope.reportTypes.forEach(function(report){
        if (report.value == $scope.selectedType){
          $scope.reportTitle = report.label;
        }
      });
    }

    $scope.isSelectedReport = function(item) {
      return $scope.selectedType === item.value
    }

    $scope.getAllDateRanges = function (callback) {
        callback($scope.allDateRanges);
    };

    currentUser.getAllRoles().then(function(roles){
      $scope.allRoles = Lazy(roles.data).map(function(role){
        var r = role;
        r.name = Lazy(r.display_label).drop(6).join('').toLowerCase();
        return r;
      }).toArray();
    });

    $scope.loadTags = function(query) {
      var deferred = $q.defer();
      var items = [];
      for (var i = 0; i < $scope.roles.length; i++) {
        if ($scope.roles[i].name.indexOf(query) == 0) {
          items.push($scope.roles[i]);
        }
      }
      deferred.resolve(items);
      return deferred.promise;
    };

    function diffArrays (A, B) {
      var strA = ":" + A.join("::") + ":";
      var strB = ":" +  B.join(":|:") + ":";
      var reg = new RegExp("(" + strB + ")","gi");
      var strDiff = strA.replace(reg,"").replace(/^:/,"").replace(/:$/,"");
      var arrDiff = strDiff.split("::");
      return arrDiff;
    }

    $scope.serialize = function(params){
      var paramsArray = params.split("&");
      var log = [];
      angular.forEach(paramsArray, function(value, key){
          angular.forEach(value.split('=')[1].split(","), function(subValue, subKey){
            this.push(value.split('=')[0] + '=' + encodeURIComponent(subValue));
          }, log);
      });
      return log.join("&");
    }

    function getName (a){ return a.name;}

    function getEmail (a){ return a.email;}

    function capitalize (a){ return a.charAt(0).toUpperCase() + a.slice(1);}

    function changeDelimiter (a){
      if( a.indexOf("-") >=0 ){
        return a.split("-").join("/")
      }
      else {
        return a.split("/").join("-")
      }
    }

    var filterRoles = function(){
      if($scope.showAll){
        $scope.roles = $scope.allRoles;
      }
      else{
        $scope.roles = Lazy($scope.allRoles).filter(function(r){
          return r.status_code == 'enabled';
        }).toArray();
      }
    };

    var formatDates = function() {

      if(!(angular.isUndefined($scope.comboValue) || $scope.comboValue === null)) {
        if($scope.comboValue.split("-").length >1) {
          $scope.startDate = $scope.comboValue.split("-")[0].trim();
          $scope.endDate = $scope.comboValue.split("-")[1].trim();
        }
        else {
          $scope.startDate = '';
          $scope.endDate = '';
        }
      }
    };

    var verifyInput = function() {
      $scope.access = true;
      $scope.warningMessages = [];
      return;
      $scope.reportItems = [];
      var noOfDays = (new Date($scope.endDate) - new Date($scope.startDate))/(1000*60*60*24);
      var noOfRoles = $scope.allowedRoles.length;
      if(noOfDays > 90 && $scope.display_full === true && (noOfRoles > 1 )) {
        $scope.access = false;
        $scope.warningMessages.push("<b>Warning</b>: Only one user's report can be generated for more than 90 days with description");
        return;
      }
      else {
        $scope.access = true;
        $scope.warningMessages = [];
      }
    };

    var fieldStatus = function() {
      $scope.notValid = $scope.startDate == '' || $scope.endDate == '';
    }

        $scope.renderHtml = function (htmlCode) {
            return $sce.trustAsHtml(htmlCode);
        };

    var calculateTotal = function(time, fee) {
        $scope.totalTime += time/60;
        if(fee) {
          $scope.totalFee += parseFloat(fee);
        }
    }

    var fetchData= function (isScope) {
      $scope.reportItems = [];
      $scope.totalFee = 0.0;
      $scope.totalTime = 0.0;
      $scope.billable= 0.0;
      $scope.nonBillable= 0.0;
      $scope.isBilling = false;

      var roles = [];
      if($scope.roletags == "") {
        roles.push("all");
      } else {
        roles = $scope.roletags.map(getEmail);
      }
      verifyInput();
      $scope.reportUrl = "";
      $timeout(function(){
        if(isScope){
          var params = "start_date="+$scope.startDate+"&end_date="+$scope.endDate+"&roles[]="+$scope.allowedRoles+"&work_chart_id="+$scope.workChart.id+"&option=from_selected&description="+$scope.display_full+"&access="+$scope.access+"&fragmentation="+$scope.reportSubKind + "&show_hours_in_the_bank=" + $scope.showHoursInTheBank;
          $scope.reportUrl="/reports/"+$scope.selectedType+"?"+$scope.serialize(params);
        }else{
          var params = "start_date="+$routeParams['start_date']+"&end_date="+$routeParams['end_date']+"&roles[]="+$scope.allowedRoles+"&work_chart_id="+$routeParams['work_chart_id']+"&option=from_selected&description="+$routeParams['description']+"&access="+$scope.access+"&fragmentation="+$scope.reportSubKind + "&show_hours_in_the_bank=" + $scope.showHoursInTheBank;
          $scope.reportUrl="/reports/"+$routeParams['report_type']+"?"+$scope.serialize(params);
        }
      });
    };

    // Watchers
    $scope.$watch('showAll', function (value){
      filterRoles();
    });
    $scope.$watch('allRoles', function(value){
      filterRoles();
    });

    $scope.$watch('showDeadStatus', function (value, old) {
      $scope.showDeadCharts = $scope.showDeadStatus;

      if ($scope.skipDeadStatusUpdateChartChange === true) {
        $scope.skipDeadStatusUpdateChartChange = false;

        return;
      }

      if (value !== old) {
        $scope.selectedChart = undefined;
      }
    });

    $scope.$watchCollection('[selectedType, comboValue, workChart, display_full, showAll, reportSubKind]', function(){
      $scope.reportItems = [];
      $scope.warningMessages = [];
      $scope.reportUrl = "";
    });

    $scope.$watch('roletags', function(chart){
      $scope.reportItems = [];
      $scope.warningMessages = [];

      $scope.checkActivePreset();
    }, true);

    $scope.$watch('selectedChart', function(chart){
      if(chart == 'null' && $scope.chart !== null && $scope.chart !== undefined) {
        $scope.selectedChart = angular.copy($scope.chart);
        return;
      }
      if(chart == 'null' || chart === null || chart == undefined){
        $scope.workChart = {
          labels: "End Point Corp.,",
          label: "End Point Corp.,",
          parent_id: 1,
          id: settings.work_chart_root_id,
          status: "active"
        };
      }
      else {
        $scope.workChart = {
          labels: chart.labels,
          label: Lazy(chart.labels).last(),
          parent_id: chart.parentId,
          id: chart.id,
          status: chart.status
        };
      }

      $scope.checkActivePreset();
    });

    $scope.$watch('warningMessages', function(){
      if($scope.warningMessages.length > 0){
        $scope.isPartial=true;
        $scope.warningMessage = $scope.warningMessages.join('<br />')
      } else {
        $scope.isPartial=false;
        $scope.warningMessage = "";
      }
    }, true);

    $scope.$watch('selectedDate', function(value){
      formatDates();
    });
    $scope.$watch('comboValue', function(value){
      formatDates();
    });

    $scope.$watch('workChart', function(value){
      fieldStatus();
    });
    $scope.$watch('comboValue', function(value){
      fieldStatus()
    });

    $scope.$on('$includeContentLoaded', function () {
      $scope.$broadcast('reportChangedAndLoaded');
    });

    // Reporting result view

    if($routeParams['start_date']) {
      $scope.reportFromUrlParams = true;
      $scope.selectedType = $routeParams['report_type'];
      $scope.setReportTitle();

      currentUser.getAllRoles().then(function (roles) {
        $scope.loadPresets().then(function () {
          $scope.startDate = $routeParams['start_date'];
          $scope.endDate = $routeParams['end_date'];
          $scope.display_full = ($routeParams['description'] === "true");
          $scope.reportSubKind = $routeParams['fragmentation'] || 'continuous';
          $scope.comboValue = changeDelimiter($routeParams['start_date'])+" - "+changeDelimiter($routeParams['end_date']);

          if ($routeParams['show_dead_status'] === 'true') {
            $scope.skipDeadStatusUpdateChartChange = true;
            $scope.showDeadStatus = true;
          }

          if($routeParams['work_chart_id'] == settings.work_chart_root_id) {
            $scope.chart = null;
            $scope.selectedChart = null;
          } else {
            $scope.chart = workCharts.byId($routeParams['work_chart_id']);
            if($scope.chart === undefined || $scope.chart === null ) {
              $scope.skipDeadStatusUpdateChartChange = true;
              $scope.showDeadStatus = true;

              // FIXME oh no, why to timeout this stuff ??
              var _getChart = function() {
                $scope.chart = workCharts.byId($routeParams['work_chart_id'], 'dead');
                $scope.workChart = angular.copy($scope.chart);
                $scope.selectedChart = angular.copy($scope.chart);
                if($scope.chart === undefined || $scope.chart === null) {
                  $timeout(_getChart, 100);
                }
              };
              _getChart();
            }
            else {
              $scope.selectedChart = angular.copy($scope.chart);
              $scope.workChart = angular.copy($scope.chart);
            }
          }

          $scope.allRoles = Lazy(roles.data).map(function(role){
            var r = role;
            r.name = Lazy(r.display_label).drop(6).join('').toLowerCase();
            return r;
          }).toArray();

          if($routeParams['roles'].toString() == 'all') {
            $scope.allowedRoles = [];
            $scope.reportRoles = "All Reportable Users";
          } else {
            var selectedRoles = $routeParams['roles'].toString().split(",");
            $scope.roletags = [];
            $scope.allRoles.forEach(function(r){
              if($routeParams['roles'] !== undefined && selectedRoles.indexOf(r.name) >= 0){
                $scope.roletags.push(r);}
            });
            $scope.allowedRoles = $scope.roletags.map(getEmail);
            $scope.reportRoles = ($scope.roletags.map(getName)).join(', ');
            var inputRoles = [];
            if(typeof $routeParams['roles'] == 'string') {
              inputRoles = $routeParams['roles'].split();
            } else {
              inputRoles = $routeParams['roles'];
            }
            $scope.restrictedUsers = $routeParams['roles'] !== undefined ? diffArrays(inputRoles, $scope.roletags.map(getName)).map(capitalize).join(', ') : [];
          }

          $scope.showAll = ($routeParams['show_all_roles'] === "true");

          $scope.datesRelative = ($routeParams['dates_relative'] === 'true');
          if ($scope.datesRelative === true) {
            $scope.datesRelativeDisabled = false;
          }

          if (($routeParams['dates_period_type'] && $routeParams['dates_period_type'] != 'false') && $routeParams['dates_relative'] === 'true') {
            var dateElemToSelect = $scope.allDateRanges.filter(function (elem) {
              return elem.name.replace(/ /g, '_').toLowerCase() == $routeParams['dates_period_type'];
            });

            if (dateElemToSelect.length > 0) {
              $scope.selectedDate = dateElemToSelect[0];
              $scope.comboValue = dateElemToSelect[0]['id'];
            }
          }

          if (!$routeParams['preset']) {
            fetchData(false);
          }
        });
      });
    }

    $scope.pdfLoaded = function() {
      $scope.$emit('spinner:completed');
    }

    $scope.generatePdf = function () {
      $scope.showPdfIframe = !$scope.showPdfIframe;
      $scope.isPdfProcessing = !$scope.isPdfProcessing;

      if($scope.showPdfIframe) {
        $scope.pdfUrl = $scope.reportUrl.replace('?', '.pdf?');
      }
    }

    $scope.$watch('pdfUrl', function(pdfUrl, old){
      if(pdfUrl !== undefined && pdfUrl !== null && pdfUrl !== 'about:blank'){
        $scope.$emit('spinner:started');
      }
    });

    $scope.$watch('reportUrl', function(reportUrl, old){
      if(reportUrl !== undefined && reportUrl !== null){
        $timeout(function(){
          $scope.pdfUrl = 'about:blank';
          $scope.isPdfProcessing = false;
          $scope.showPdfIframe = false;
          $scope.switchStatus = false;
        }, 100)
      }
    });

    $scope.generateReport = function () {
      $scope.showPdfIframe = false;
      $scope.hasNotApprovedEntries = false;
      var roles = [];
      $scope.warningMessages = [];

      if($scope.searchString !== "") {
        $scope.warningMessages.push("<b>Warning</b>: There is no user selected for search string <b>"+$scope.searchString+"</b>");
        return;
      }

      if($scope.roletags == "") {
        roles.push("all");
        $scope.reportRoles = "All Reportable Users";
        $scope.allowedRoles = [];
      } else {
        roles = $scope.roletags.map(getName);
        $scope.reportRoles = ($scope.roletags.map(getName)).join(', ');
        $scope.allowedRoles = $scope.roletags.map(getEmail);
      }

      $location.search({
        report_type: $scope.selectedType,
        start_date: changeDelimiter($scope.startDate),
        end_date: changeDelimiter($scope.endDate),
        work_chart_id: $scope.workChart.id,
        roles: roles,
        description: $scope.display_full.toString(),
        show_all_roles: String($scope.showAll),
        fragmentation: $scope.reportSubKind,
        dates_relative: String($scope.datesRelative),
        dates_period_type: $scope.selectedDate ? $scope.selectedDate.name.replace(/ /g, '_').toLowerCase() : false
      });

      if($scope.openInNewWindow){
        $timeout(function(){
          window.open(window.location.href, '_blank');
        }, 200);
      }
      else {
        fetchData(true);
      }
    };

    $scope.savePreset = function () {
      var settings = $location.search();
      var presetToLoadAfterSave = $scope.namePresetName;
      settings.name = $scope.namePresetName;

      reports.createPreset(settings)
        .then(function () {
          $scope.namePresetName = '';
          $scope.loadPresets(presetToLoadAfterSave);

          gToast.open('Preset was created successfully');
        });
    };

    $scope.loadPresets = function (nameToLoad) {
      var deferred = $q.defer();

      reports.getPresets()
        .then(function (data) {
          $scope.presets = data.data;

          if ($routeParams['preset']) {
            var filteredPresetsById = $scope.presets.filter(function (preset) {
              return preset.id == $routeParams['preset'];
            });

            if (filteredPresetsById.length) {
              $scope.presetPreventFetch = true;
              $scope.currentPreset = filteredPresetsById[0];
            }
          }

          if (nameToLoad) {
            var filteredPresets = $scope.presets.filter(function (preset) {
              return nameToLoad == preset.name;
            });

            if (filteredPresets.length) {
              $scope.presetPreventFetch = true;
              $scope.currentPreset = filteredPresets[0];
            }
          }

          deferred.resolve();
        });

      return deferred.promise;
    };
    $scope.loadPresets();

    $scope.removePreset = function () {
      if (confirm('Are you sure to remove this preset?')) {
        if ($scope.currentPreset) {
          reports.removePreset($scope.currentPreset.id)
            .then(function () {
              $scope.loadPresets();
              $scope.currentPreset = null;
              gToast.open('Preset was removed successfully');
            });
        }
      }
    };

    $scope.checkActivePreset = function () {
      var roles = [];
      var datePeriod = $scope.selectedDate ? $scope.selectedDate.name.replace(/ /g, '_').toLowerCase() : 'false';
      var set = false;
      var startDate = $scope.startDate.replace(/-/g, '/');
      var endDate = $scope.endDate.replace(/-/g, '/');

      if ($scope.roletags == '') {
        roles.push('all');
      } else {
        roles = $scope.roletags.map(getName);
      }

      $scope.presets.forEach(function (el) {
        if (set === true) {
          return;
        }

        if (el.report_type === $scope.selectedType &&
            ((el.work_chart_id === 2 && (typeof $scope.selectedChart === 'undefined' || $scope.selectedChart === null)) ||
              $scope.selectedChart != null && typeof $scope.selectedChart === 'object' && el.work_chart_id === $scope.selectedChart.id) &&
            el.description === $scope.display_full &&
            _.isEqual(el.roles, roles) &&
            el.show_all_roles === $scope.showAll &&
            el.fragmentation === $scope.reportSubKind &&
            el.dates_relative === $scope.datesRelative &&
            (el.dates_relative === false ||
              el.dates_period_type === datePeriod
            ) &&
            (el.dates_relative === true ||
              (el.start_date.replace(/-/g, '/') === startDate &&
              el.end_date.replace(/-/g, '/') === endDate)
            )) {
          $scope.currentPreset = el;
          set = true;
        }
      });

      if (set === false) {
        $scope.currentPreset = null;
      }
    };

    $scope.isWorkChartActive = function (workChartId) {
      var workChart = workCharts.byId(workChartId, 'dead');

      if (workChart.status !== 'active') {
        return false;
      }

      if (workChart.parentId !== 2 && workChart.id !== 2) {
        return $scope.isWorkChartActive(workChart.parentId);
      }

      return workChart.status === 'active';
    };

    $scope.$watch('reportSubKind', function (newVal) {
      if (newVal != 'continuous') {
        $scope.display_full = false;
      };
    });

    $scope.$watchCollection(
      '[selectedType, comboValue, workChart, display_full,' +
      ' showAll, roletags, reportSubKind, datesRelative]',
      function () {
        if (!$scope.reportFromUrlParams) $scope.displayReport = false;

        $scope.checkActivePreset();
    });

    $scope.$watch('currentPreset', function (newPreset, oldPreset) {
      if ($scope.presetPreventFetch === false) {
        if (newPreset) {
          var filteredPresets = $scope.presets.filter(function (preset) {
            return newPreset === preset;
          });

          if (filteredPresets.length > 0) {
            var settingsObj = newPreset;

            settingsObj.dates_relative = String(settingsObj.dates_relative);
            settingsObj.description = String(settingsObj.description);
            settingsObj.show_all_roles = String(settingsObj.show_all_roles);
            settingsObj.preset = newPreset.id;

            delete settingsObj.created_at;
            delete settingsObj.user_id;
            delete settingsObj.updated_at;
            delete settingsObj.name;
            delete settingsObj.id;

            if (!$scope.isWorkChartActive(settingsObj.work_chart_id)) {
              settingsObj.show_dead_status = 'true';
            }

            $location.search(settingsObj);
            $route.reload();
          }
        } else {
          if (typeof newPreset === 'undefined' && $routeParams['start_date'] && oldPreset) {
            $location.search({});
            $route.reload();
          }
        }
      } else {
        $scope.presetPreventFetch = false;
      }
    });
  }]);
