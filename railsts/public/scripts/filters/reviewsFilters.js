angular.module('reviewsFilters', [])
  .filter('byRole', function () {
    return function (input, roletags) {
      var emails = [];
      var filtered = [];

      roletags.map(function (role) {
        emails.push(role.email);
      });

      if (emails.length > 0) {
        input.forEach(function (val) {
          if (emails.indexOf(val.owner.email) != -1) {
            filtered.push(val);
          }
        });

        return filtered;
      }

      return input;
    };
  })
  .filter('byTeam', function () {
    return function (input, selectedTeam, users) {
      if (selectedTeam != '') {
        var owner = false;
        var user = false;
        var filtered = [];
        var member = false;

        input.forEach(function (entry) {
          member = false;
          owner = entry.owner;

          user = Lazy(users).filter(function (userL) {
            if (userL.id === owner.id) {
              return true;
            }

            return false;
          }).toArray();
          user = user[0];

          user.team_ids.map(function (team_id) {
            if (team_id === selectedTeam.id) {
              member = true;
            }
          });

          if (member === true) {
            filtered.push(entry);
          }
        });

        return filtered;
      }

      return input;
    };
  })
  .filter('byRejected', function () {
    return function (input, rejected) {
      var filtered = [];
      var filteredWithoutEmptyHeaders = [];
      var headerBefore = false;

      if (rejected === true) {
        input.forEach(function (entry) {
          if (entry.isHeader === true) {
            headerBefore = entry;

            return false;
          }

          if (entry.comments.length > 0) {
            if (headerBefore !== false) {
              filtered.push(headerBefore);
              headerBefore = false;
            }

            filtered.push(entry);
          }
        });

        return filtered;
      }

      return input;
    };
  })
  .filter('byPeriod', function () {
    return function (input, period) {
      var filtered = [];
      var entryDate;

      if (period != '' && period !== undefined && period !== null) {
        input.forEach(function (entry) {
          entryDate = new Date(entry.date_performed);

          if (entryDate.getTime() >= period.from.getTime() && entryDate.getTime() <= period.to.getTime()) {
            filtered.push(entry);
          }
        });

        return filtered;
      }

      return input;
    };
  });
