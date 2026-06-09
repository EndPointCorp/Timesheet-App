# Tests to write for this patch (each guards one part of why we kept it):
#
# TODO(test) RISK: round-trip a recur_at value through CronJob/Transaction and
#   assert it comes back as a CronSpec with the same fields. If the OID lookup
#   silently fails, recur_at falls back to default handling and breaks with no
#   error — this test is what makes that failure loud.
#
# TODO(test) ASSUMPTION: assert the cron_spec type is actually registered in the
#   adapter type map (or that no "unknown OID" warning fires on boot). Confirms the
#   type exists and the OID lookup works, instead of assuming it.
#
# TODO(test) TRADE-OFF: exercise the scheduling behavior end-to-end (recurs?,
#   dates_since) so a future Rails change that silently breaks this monkey-patch
#   gets caught by the suite, not in production.
module CronSpecTypeRegistration
  def initialize_type_map(mapping = type_map)
    super

    oid = select_value("SELECT oid FROM pg_type WHERE typname = 'cron_spec'")
    if oid
      mapping.register_type(
        oid.to_i,
        ActiveRecord::ConnectionAdapters::PostgreSQL::OID::SpecializedString.new(:cron_spec)
      )
    end
  end
end
ActiveRecord::ConnectionAdapters::PostgreSQLAdapter.prepend(CronSpecTypeRegistration)