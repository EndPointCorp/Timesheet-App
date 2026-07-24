class TimeZone < ActiveRecord::Base
  self.table_name = :time_zones

  # This table is the single source of truth for valid time zones; the users
  # foreign key (users.time_zone_code -> time_zones.code) enforces the same set.
  # `visible` is the subset offered in the user-facing dropdown, earliest
  # UTC offset first, then by code so zones sharing an offset are ordered
  # deterministically. is_visible is a display filter only, not a validity rule.
  scope :visible, -> { where(is_visible: true).order(:utc_offset, :code) }
end
