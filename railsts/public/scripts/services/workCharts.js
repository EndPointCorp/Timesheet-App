'use strict';

angular.module('angularApp')
  .factory('workCharts', function($http, $rootScope, $q, currentUser, settings){
    var service = {
      rootId: settings.work_chart_root_id,
      isRefreshing: false,
      rawCharts: [],
      rawPossibleParents: [],
      possibleParents: Lazy([]),
      charts: Lazy([]),
      allCharts: Lazy([]),
      rootChildren: Lazy([]),
      version: "",
      showInactive: false,
      showDead: false,
      quickClients: Lazy([]),
      quickOthers: Lazy([]),
      rawQuicks: { clients: [], others: [] },
      durationKinds: Lazy([]),
      dataLoaded: false
    };

    var decodeStored = function(key) {
      var data = localStorage[key];

      if ( data[0] !== '[' && data[0] !== '{' ) {
        data = LZUTF8.decompress(data, {inputEncoding: "StorageBinaryString"});
      }

      return JSON.parse(data);
    };

    var encodeToStore = function(input) {
      return LZUTF8.compress(JSON.stringify(input), {outputEncoding: "StorageBinaryString"});
    };

    if(localStorage.hasOwnProperty('rawCharts')){
      service.rawCharts = decodeStored('rawCharts');
    }
    if(localStorage.hasOwnProperty('rawPossibleParents')){
      service.rawPossibleParents = decodeStored('rawPossibleParents');
    }
    if(localStorage.hasOwnProperty('chartsVersion')){
      service.version = localStorage['chartsVersion'];
    }
    if(localStorage.hasOwnProperty('rawQuicks')){
      service.rawQuicks = decodeStored('rawQuicks');
    }
    if(localStorage.hasOwnProperty('durationKinds')){
      service.durationKinds = decodeStored('durationKinds');
    }
    var toChart = function(item){
      var getTitle = function(){
        if(item.display_label == null || item.display_label == undefined){
          if(item.labels[0] == 'Clients'){
            return Lazy(item.labels).drop(1).join(" / ");
          }
          else{
            return Lazy(item.labels).join(" / ");
          }
        }
        return item.display_label;
      };
      return {
        parentId: item.parent_id,
        dontSendEmptyReports: item.dont_send_empty_reports,
        id: item.id,
        status: item.status,
        title: getTitle(),
        labels: item.labels
      }
    };
    var forStatus = function(seq, status){
      if(status === undefined){
        if(service.showDead) status = 'dead';
        else if (service.showHidden) status = 'hidden';
        else status = 'active';
      }
      if(status == 'active'){
        return seq.filter(function(c){
          return c.status == 'active';
        });
      }
      else if(status == 'hidden'){
        return seq.filter(function(c){
          return c.status == 'active' || c.status == 'hidden';
        });
      }
      else {
        return seq;
      }
    };
    service.rebuildSequences = function(){
      service.charts = forStatus(Lazy(service.rawCharts)).map(toChart);
      service.allCharts = Lazy(service.rawCharts).map(toChart);
      service.rootChildren = service.childrenForId(service.rootId);

      if (typeof localStorage.rawCharts !== 'undefined') {
        service.dataLoaded = true;
      }
    };
    service.rootChildrenByStatus = function(status, rootId){
      return service.childrenForId(rootId, status);
    };
    service.cacheData = function(){
      localStorage.chartsVersion = service.version;
      localStorage.rawCharts = encodeToStore(service.rawCharts);
    };
    service.cacheQuicks = function(){
      localStorage.rawQuicks = encodeToStore(service.rawQuicks);
    };
    service.rebuildQuicksSequences = function(){
      service.quickClients = forStatus(Lazy(service.rawQuicks.clients).map(toChart));
      service.quickOthers = forStatus(Lazy(service.rawQuicks.others).map(toChart));
    };
    service.refreshQuicks = function(){
      $http.get("/work_charts/quicks.json").success(function(rawQuicks){
        service.rawQuicks = rawQuicks;
        service.cacheQuicks();
        service.rebuildQuicksSequences();
      });
    }; service.persistEmptyReportsSetting = function(id, setting){
      var params = {
        dont_send_empty_reports: setting
      };
      return $http.put("/work_charts/" + id + "/update_reporting_settings.json", params);
    };
    service.refreshAbleToBeParents = function(){
      $http.get("/work_charts/able_to_be_parents.json").success(function(rawPossibleParents){
        service.rawPossibleParents = rawPossibleParents;
        localStorage.rawPossibleParents = encodeToStore(rawPossibleParents);
        service.possibleParents = Lazy(rawPossibleParents).map(function(c){
          var ret = c;
          ret.labels = c.path;
          ret.label = c.display_label;
          ret.fullLabelsPath = Lazy(c.labels).join(" - ");
          return ret;
        }).sortBy(function(c){
          return c.labels;
        });
      });
    };
    service.refresh = function(){
      var get1 = $http.get("/work_charts.json?include_inactive=true&include_dead=true").success(function(rawCharts, status, headers){
        service.rawCharts = rawCharts;
        service.version = headers('Charts-Version');
        service.cacheData();
        service.rebuildSequences();
      });
      var get2 = service.refreshAbleToBeParents();
      return $q.all([get1, get2]);
    };
    service.refreshDurationKinds = function(){
      $http.get("/duration_kinds.json").success(function(kinds){
        localStorage.durationKinds = encodeToStore(kinds);
        service.durationKinds = Lazy(decodeStored('durationKinds'));
      });
    };
    service.kindsFor = function(chart, callback){
      var q = $http.get("/work_charts/" + chart.id + "/kinds.json")
      if(callback !== undefined){
        q.success(callback); 
      }
      return q;
    };
    service.atSameLevel = function(chart){
      return service.childrenForId(chart.parentId || chart.parent_id);
    };
    service.atSameLevelForStatus = function(chart, status){
      return service.childrenForId(chart.parentId || chart.parent_id, status);
    };
    service.saveChart = function(chart){
      var data = {
        work_chart: {
          display_label: chart.title || chart.label,
          status: chart.status,
          parent_id: chart.parentId || chart.parent_id,
          dont_send_empty_reports: chart.dontSendEmptyReports || false
        }
      };
      var q = $http.put("/work_charts/" + chart.id + ".json", data);
      q.success(function(){
        var raw = Lazy(service.rawCharts).find(function(c){
          return c.id == chart.id;
        });
        raw.parent_id = chart.parent_id || chart.parentId;
        raw.display_label = chart.title || chart.label;
        raw.status = chart.status;
        service.version = service.version + "-just-changed";
        service.rebuildSequences();
      });
      return q;
    };
    service.saveKinds = function(kinds, chart){
      var codes = Lazy(kinds).filter(function(k){
        return k.isActive;
      }).map(function(k){
        return k.code;
      }).toArray();
      var defaults = Lazy(kinds).find(function(k){
        return k.isDefault;
      }).code;
      var data = {
        work_chart_kinds: codes,
        work_chart_kinds_defaults: defaults
      };
      return $http.put("/work_charts/" + chart.id + "/save_durations.json", data);
    };
    service.clearKindsFor = function(chart){
      return $http.put("/work_charts/" + chart.id + "/clear_durations.json");
    };
    service.deleteChart = function(chart){
      var q = $http.delete("/work_charts/" + chart.id + ".json");
      q.success(function(){
        service.rawCharts = Lazy(service.rawCharts).filter(function(c){
          return c.id.toString() != chart.id.toString();
        });
        service.rebuildSequences();
        service.version = service.version + "-just-updated";
        service.refresh();
      });
      return q;
    };
    service.createChild = function(title, chart){
      var data = {
        work_chart: {
          parent_id: chart.id,
          display_label: title,
          status: 'active'
        }
      };
      var q = $http.post("/work_charts.json", data);
      q.success(function(newChart, status, headers){
        var c = newChart.chart;
        c.label = c.title = c.display_label;
        c.labels = chart.labels.concat(c.label);
        service.rawCharts = service.rawCharts.concat(c);
        service.rebuildSequences();
        service.version = headers('Charts-Version') + "-just-changed";
      });
      return q;
    };
    service.byId = function(id, status){
      return forStatus(Lazy(service.allCharts), status).find(function(c){
        return c.id == id;
      });
    };
    service.getHeirsFor = function(chart){
      return $http.get("/work_charts/" + chart.id + "/find_heirs.json");
    };
    service.allByParentId = function(id){
      return service.allCharts.filter(function(c){
        if(c.parentId !== undefined){
          return c.parentId == id;
        }else{
          return c.parent_id == id;
        }
      });
    };
    service.byParentId = function(id){
      return service.charts.filter(function(c){
        if(c.parentId !== undefined){
          return c.parentId == id;
        }else{
          return c.parent_id == id;
        }
      });
    };
    service.childrenForId = function(id, status){
      if(id === undefined) return Lazy([]);
      var forId = function(item){
        return (item.parentId || item.parent_id || null).toString() == id.toString();
      };
      return forStatus(service.allCharts, status).filter(forId);
    };
    service.rebuildSequences();
    service.rebuildQuicksSequences();
    $rootScope.$on('charts:newVersion', function(){
      if(service.isRefreshing == false) {
        service.isRefreshing = true;
        localStorage.rawCharts = encodeToStore([]);
        service.refresh().then(function(){
          service.isRefreshing = false;
        }, function(){
          service.isRefreshing = false;
        });
      }
    });

    return service;
  }).factory('workChartsInterceptor', function($q, $rootScope){
    return {
      response: function(response){
        var versionOnServer = response.headers('Charts-Version');
        if((versionOnServer !== null && localStorage.chartsVersion !== versionOnServer) || localStorage.rawCharts === undefined || localStorage.rawCharts == "[]"){
          localStorage.chartsVersion = versionOnServer;
          $rootScope.$broadcast('charts:newVersion');
        }
        return response || $q.when(response);
      }
    }
  });
