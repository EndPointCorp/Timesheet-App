'use strict';

angular.module('angularApp')
  .factory('rolesEditor', function($http, $rootScope, $location, workCharts, settings){
    var service = {
      user: null,
      usersRawData: {},
      usersDetail: {},
      rawRoles: {},
      rawRights: {},
      rawRightTypes: {},
      rawWorkCharts: {},
      rawICUsers: {},
      groupsDetail: {},
      rolesDetail: {},
      sourceRoles: {},
      rolesDetailWatcher: 0
    };

    service.tryCreateRole = function(label, code, description){
      var params = {
        'label': label,
        'code': code,
        'description': description
      };
      var q = $http.post('/roles/create_role', params);
      return q;
    };

    service.processAllRawDetails = function(){
      return service.rolesDetailWatcher;
    }

    service.getAllRawDetails = function(isReload){
      var q = $http.get("/users/details_raw.json");
      q.then(function(data){
        service.usersRawData = angular.fromJson(data.data);
        service.usersDetail = {}
        service.rawRoles = {};
        service.rawRights = {};
        service.rawRightTypes = {};
        service.rawWorkCharts = {};
        service.rawICUsers = {};

        // Creating key-value for quick access
        angular.forEach(service.usersRawData.roles, function(role){
          service.rawRoles[role.id] = role;
        })
        angular.forEach(service.usersRawData.rights, function(right){
          service.rawRights[right.id] = horse;})
        angular.forEach(service.usersRawData.right_types, function(right_type){
          service.rawRightTypes[right_type.id] = right_type;
        })
        angular.forEach(service.usersRawData.users, function(user){
          service.rawICUsers[user.id] = user;
        })

        $rootScope.$watch(function() {
          return workCharts.dataLoaded;
        }, function(value) {
          if (value === true) {
            // Extracting Teams and Groups from Roles table
            var role_ids = service.usersRawData.roles_has_roles
            var mygroups = service.usersRawData.roles.filter(function(role){return getValuesByKey(role_ids, 'has_role_id').indexOf(role.id) >= 0})
            service.allTeams = Lazy(mygroups).filter(function(group){ return hasTeamRole(service.usersRawData.roles_has_roles, group.id) == true}).sortBy(function(c){ return c.label}).toArray()
            service.allGroups = Lazy(mygroups).filter(function(group){ return hasTeamRole(service.usersRawData.roles_has_roles, group.id) == false}).sortBy(function(c){ return c.label}).toArray()
            service.allICUsers = service.usersRawData.users;
            service.allICGroups= Lazy(service.usersRawData.roles).filter(function(role) { return role.label.indexOf("User:") < 0}).sortBy(function(c){ return c.label}).toArray();
            service.allICRoles = Lazy(service.usersRawData.roles).sortBy(function(c){ return c.label}).toArray();
            service.timeZones = Lazy(service.usersRawData.users).map(function(user) { return user.time_zone}).uniq().toArray();
            angular.forEach(service.usersRawData.users, function(user){
              if(user['status_code'] == 'enabled') {
                user['status'] = true;
              } else {
                user['status'] = false;
              }
              user['changes'] = {'isChanged' : false};
              var role_ids = Lazy(service.usersRawData.roles_has_roles).filter(function(role){ return role.role_id == user['role_id']; }).toArray()
              var mygroups = Lazy(service.usersRawData.roles).filter(function(role){ return getValuesByKey(role_ids, 'has_role_id').indexOf(role.id) >= 0 }).toArray()
              user['myteam'] = Lazy(mygroups).filter(function(group){ return hasTeamRole(service.usersRawData.roles_has_roles, group.id) == true}).toArray()
              user['myroles'] = Lazy(mygroups).filter(function(group){ return hasTeamRole(service.usersRawData.roles_has_roles, group.id) == false}).toArray()

              var directRights = Lazy(service.usersRawData.rights).filter(function(right){ return right.role_id == user['role_id'] }).toArray()
              var inDirectRights = Lazy(service.usersRawData.rights).filter(function(right){ return getValuesByKey(mygroups, 'id').indexOf(right.role_id) >= 0 }).toArray()
              user['myroles'] = [];
              user['myrights'] = [];
              user['myrights'] = user['myrights'].concat(getTargets(directRights, true));
              user['myrights'] = user['myrights'].concat(getTargets(inDirectRights, false));
              service.usersDetail[user['id']] = user;
            });

            // building groups object
            service.groupsDetail = {};
            service.sourceRoles = angular.copy(Lazy(service.usersRawData.roles).filter(function(role) { return role.label.indexOf("User:") < 0}).sortBy(function(c){ return c.label}).toArray())
            angular.forEach(angular.fromJson(service.sourceRoles), function(role){
              var role_ids = Lazy(service.usersRawData.roles_has_roles).filter(function(role){ return role.role_id == role['id'] }).toArray()
              role['myroles'] = Lazy(service.usersRawData.roles).filter(function(role){ return getValuesByKey(role_ids, 'has_role_id').indexOf(role.id) >= 0 }).toArray()

              var directRights = Lazy(service.usersRawData.rights).filter(function(right){ return right.role_id == role['id'] }).toArray()
              var inDirectRights = Lazy(service.usersRawData.rights).filter(function(right){ return getValuesByKey(role['myroles'], 'id').indexOf(right.role_id) >= 0 }).toArray()
              role['myrights'] = []
              role['myrights'] = role['myrights'].concat(getTargets(directRights, true));
              role['myrights'] = role['myrights'].concat(getTargets(inDirectRights, false));
              role['changes'] = {'isChanged' : false};
              service.groupsDetail[role['id']] = role
            })
            if(isReload) {
              service.rolesDetailWatcher = service.rolesDetailWatcher + 1;
            }
            $rootScope.$broadcast('user:updated');
          }
        });
      });
    };

    function getTargets(rights, isDirect) {
      var dRights = Lazy(rights).map(function(directRight) {
        var right = {};
        right['id'] = directRight['id'];
        var rightType = service.rawRightTypes[directRight.right_type_id];
        right['label'] = rightType['label'];
        right['target_kind_code'] = rightType['target_kind_code'];
        right['type'] = isDirect;
        var targets = Lazy(service.usersRawData.right_targets).filter(function(target) {
          return target.right_id == right['id']
        }).map(function(t) {
          var target = t;
          var targetLabel = null;
            if(right.target_kind_code == 'work_chart' || right.target_kind_code == 'site_mgmt_action' || right.target_kind_code == 'account') {
              targetLabel = workCharts.byId(parseInt(target.ref_obj_pk), 'dead')['title']
            } else if(right.target_kind_code == 'user') {
              targetLabel = service.rawICUsers[target.ref_obj_pk]['username']
            } else if(right.target_kind_code == 'role') {
              targetLabel = service.rawRoles[target.ref_obj_pk]['label']
            } else {
              targetLabel = ""
            }
            target['label'] = targetLabel
            return target;
        }).toArray()
        right['targets'] = targets
        return right;
      }).toArray();
      return dRights
    }

    function hasTeamRole(arr, value) {
      var result  = arr.filter(function(o){return o.role_id == value && o.has_role_id == settings.team_role_id } );
      return result.length > 0? true : false;
    }

    function getValuesByKey(arr, key) {
      var values = [];
      angular.forEach(arr, function(obj){
        if(obj[key]) {
          values.push(obj[key]);
        }
      })
      return values
    }

    /**
     * Getting all the children of the root user groups
     * @param  {array}
     * @param  {array}
     * @param  {array}
     * @return {array}
     */
    function getRoleChildren(roles, mappings, allRoles) {
      var groups = roles;
      var childrenMappings = [];
      var childrenRoles = [];

      roles.forEach(function(group) {
        childrenMappings = Lazy(mappings).filter(function(mapping){
          return mapping.role_id == group.id && mapping.has_role_id != '0';
        }).toArray();

        childrenRoles = childrenRoles.concat(Lazy(allRoles).filter(function(role){
          return getValuesByKey(childrenMappings, 'has_role_id').indexOf(role.id) >= 0;
        }).toArray());
      });

      if (childrenRoles.length > 0) {
        groups = groups.concat(getRoleChildren(childrenRoles, mappings, allRoles));
      }

      groups = groups.concat(childrenRoles);

      return groups;
    }

    service.tryUpdateUserEntity = function(changes, userId){
      var q = $http({ method: 'PUT',
        url: '/users/' + userId,
        data: {user_entity: JSON.stringify(changes), user_id: userId},
        headers: {contentType : 'application/json; charset=utf-8'}
      });
      return q;
    };
    service.tryUpdateGroupEntity = function(changes, groupId){
      var q = $http({ method: 'PUT',
        url: '/groups/' + groupId,
        data: {group_entity: JSON.stringify(changes), group_id: groupId},
        headers: {contentType : 'application/json; charset=utf-8'}
      });
      return q;
    };
    service.getUserDetails = function(userId){
      return $http.get("/users.json?user_id="+userId);
    };

    return service;
  });
