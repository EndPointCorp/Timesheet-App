# Customizations to the PostgreSQL type map. Both restore behavior this app
# relies on but Rails 8's defaults don't give us. One prepended module overrides
# initialize_type_map and re-registers two types after Rails builds its defaults.
#
# --- interval -------------------------------------------------------------
# Rails 6.1+ maps Postgres `interval` columns to ActiveSupport::Duration. This app
# predates that and expects the raw string form (Interval.new(budget.hours_left),
# the WorkEntryDuration#duration= setter). Restore the pre-6.1 string behavior.
#
# TODO(interval modernization): a bridge back to the Rails <=6.0 default, not a
#   permanent home. When the app's time math moves to ActiveSupport::Duration
#   (rewrite lib/interval.rb + its call sites), delete the interval block below.
# TODO(interval tests): lock the money/time round-trip so a future change can't
#   silently break it:
#   - WorkEntryDuration#duration = <minutes>, save, reload -> same clock string
#   - negative interval (overspent budget): Interval.new("-1:30:00").minutes == -90
#   - HoursInTheBank::Budget#hours_left returns a parseable string the
#     "not enough hours" check reads correctly
#
# --- cron_spec ------------------------------------------------------------
# cron_spec is a custom composite type this app defines; Rails doesn't know it.
# Read the column as an opaque string so recur_at round-trips.
#
# TODO(test) RISK: round-trip a recur_at value through CronJob/Transaction and
#   assert it comes back as a CronSpec with the same fields. If the OID lookup
#   silently fails, recur_at falls back to default handling and breaks with no
#   error — this test is what makes that failure loud.
# TODO(test) ASSUMPTION: assert the cron_spec type is actually registered in the
#   adapter type map (or that no "unknown OID" warning fires on boot). Confirms the
#   type exists and the OID lookup works, instead of assuming it.
# TODO(test) TRADE-OFF: exercise the scheduling behavior end-to-end (recurs?,
#   dates_since) so a future Rails change that silently breaks this monkey-patch
#   gets caught by the suite, not in production.
module CustomPostgresTypes
  def initialize_type_map(mapping = type_map)
    super

    # interval -> String: restore the Rails <=6.0 default (see notes above)
    mapping.register_type "interval" do |*args, sql_type|
      ActiveRecord::Type::String.new
    end

    # cron_spec -> opaque string: teach Rails this app's custom composite type
    oid = select_value("SELECT oid FROM pg_type WHERE typname = 'cron_spec'")
    if oid
      mapping.register_type(
        oid.to_i,
        ActiveRecord::ConnectionAdapters::PostgreSQL::OID::SpecializedString.new(:cron_spec)
      )
    end
  end
end
ActiveRecord::ConnectionAdapters::PostgreSQLAdapter.prepend(CustomPostgresTypes)