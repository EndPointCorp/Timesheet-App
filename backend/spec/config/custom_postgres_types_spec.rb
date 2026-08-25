require 'spec_helper'

# Round-trip guard for config/initializers/custom_postgres_types.rb.
#
# That initializer re-registers two Postgres types after Rails builds its
# defaults. `interval` columns must read back as the legacy "HH:MM:SS" string
# (not ActiveSupport::Duration), and the custom `cron_spec` composite type must
# read back as an opaque string the CronSpec coder can load. Both are
# deliberately-legacy shims with no other test coverage.
#
# These specs write a value through each type and read it back, so a future
# Rails or Postgres change that breaks a shim fails here instead of silently in
# production -- the "not enough hours in the bank" class of bug.
describe "Custom Postgres type registration" do
  describe "interval columns round-trip as legacy strings" do
    it "reads an interval column back as an HH:MM:SS string, not a Duration" do
      entry = FactoryBot.create(:work_entry, duration_total: 90)
      duration = entry.work_entry_durations.first.reload.duration

      # If the interval->String registration is lost, Rails hands this back as
      # an ActiveSupport::Duration and both assertions fail. The clock string
      # also pins intervalstyle=postgres: the iso_8601 form ("PT1H30M") would
      # misparse to 0 minutes.
      expect(duration).to be_a(String)
      expect(Interval.new(duration).minutes).to eq(90)
    end

    it "round-trips a negative interval so overspent budgets still parse" do
      duration_record = FactoryBot.create(:work_entry).work_entry_durations.first

      # The duration= setter drops the sign, so write the negative interval
      # straight to the column. This is the overspent-budget shape hours_left
      # returns; a broken intervalstyle would return a form Interval can't read.
      duration_record.update_column(:duration, "-1:30:00")

      expect(Interval.new(duration_record.reload.duration).minutes).to eq(-90)
    end
  end

  describe "cron_spec columns round-trip through the CronSpec coder" do
    it "reads recur_at back as a CronSpec with the same fields" do
      transaction = FactoryBot.create(:monthly_recurring_transaction)

      recur_at = transaction.reload.recur_at

      expect(recur_at).to be_a(CronSpec)
      expect(recur_at.to_a).to eq([0, 0, 1, nil, nil, nil])
    end

    it "registers the cron_spec type instead of falling back to an unknown OID" do
      # The round-trip above passes even without the registration: Rails treats
      # the unknown OID as a plain String and the CronSpec coder still parses
      # it (logging "unknown OID ...: it will be treated as String"). So assert
      # the registration itself. Deleting it -- and inviting whatever a future
      # Rails does with an unrecognised composite OID -- fails loudly here.
      cast_type = ActiveRecord::Base.connection.lookup_cast_type("cron_spec")

      expect(cast_type).to be_a(
        ActiveRecord::ConnectionAdapters::PostgreSQL::OID::SpecializedString
      )
    end
  end
end
