# Seeds the database with reference data (enums/lookups) and a small
# fabricated demo dataset so a fresh clone is usable out of the box.
#
# Idempotent: safe to run multiple times. Reference data loads once;
# demo data uses find_or_create_by! on natural keys.

require 'active_record'

NOW = DateTime.now

puts "=== Seeding database ==="

# ---------------------------------------------------------------------
# 1. Reference data (account_kinds, duration_kinds, right_types, ...)
# ---------------------------------------------------------------------
if UserStatus.count.zero?
  puts "[ref] Loading reference data..."
  sql_path = Rails.root.join('db', 'seeds', 'reference_data.sql')
  raw = File.read(sql_path)
  # pg_dump 16+ emits psql meta-commands (\restrict, \unrestrict) which
  # ActiveRecord cannot execute, plus set_config('search_path', '', false),
  # which would poison this connection for every unqualified statement the
  # rest of this seed run executes. Strip both; the rest is plain SQL.
  clean = raw.lines.reject { |l| l.start_with?('\\') || l.include?("set_config('search_path'") }.join
  ActiveRecord::Base.connection.execute(clean)
  # reference_data.sql is a pg_dump; its leading `set_config('search_path','')`
  # is non-local, so it sticks on this connection and would make every
  # unqualified table reference below fail with "relation does not exist".
  # Restore the default search_path before continuing.
  ActiveRecord::Base.connection.execute(%q{SET search_path TO "$user", public})
  puts "[ref] loaded"
else
  puts "[ref] already loaded — skipping"
end

# ---------------------------------------------------------------------
# 2. Work-chart tree (root + leaf projects)
# ---------------------------------------------------------------------
# Materialized views chart_labels / charts_search_specs start unpopulated
# on a fresh DB. A trigger on work_chart tries to REFRESH ... CONCURRENTLY
# which fails until the MV has been populated at least once. Do one
# non-concurrent refresh up front so subsequent inserts succeed.
ActiveRecord::Base.connection.execute(<<~SQL)
  REFRESH MATERIALIZED VIEW chart_labels;
  REFRESH MATERIALIZED VIEW charts_search_specs;
SQL

puts "[chart] Building work-chart tree..."

# Tree structure the UI expects:
#   Root ("Demo Company")
#     ├── Clients       (branch; billable client projects live under here)
#     │     ├── Website Redesign
#     │     ├── Mobile App
#     │     ├── ...
#     └── Other         (branch; non-client activities)
#           ├── Internal Meeting
#           └── PTO
# Only leaf nodes can hold work entries (enforced by a DB trigger).

def make_chart(label, parent, idx)
  WorkChart.find_or_create_by!(display_label: label, parent_id: parent&.id) do |c|
    c.branch_order = idx
    c.status = 'active'
    c.date_created = NOW
    c.last_modified = NOW
  end
end

root     = make_chart('Demo Company', nil, 0)
clients  = make_chart('Clients',      root, 0)
other    = make_chart('Other',        root, 1)

CLIENT_PROJECTS = [
  'Website Redesign',
  'Mobile App',
  'Internal Tools',
  'Client Support',
  'Research and Development',
].freeze

OTHER_LEAVES = ['Internal Meeting', 'PTO'].freeze

client_leaves = CLIENT_PROJECTS.each_with_index.map { |n, i| make_chart(n, clients, i) }
other_leaves  = OTHER_LEAVES.each_with_index.map   { |n, i| make_chart(n, other,   i) }
leaves = client_leaves + other_leaves

# Each leaf chart needs a kind_set, billable/nonbillable kinds, and a default.
conn = ActiveRecord::Base.connection
leaves.each do |p|
  default_kind = other_leaves.include?(p) ? 'nonbillable_standard' : 'billable_standard'
  conn.execute(<<~SQL)
    INSERT INTO work_chart_kind_sets (work_chart_id) VALUES (#{p.id})
      ON CONFLICT (work_chart_id) DO NOTHING;
    INSERT INTO work_chart_kinds (work_chart_id, kind_code)
      VALUES (#{p.id}, 'billable_standard'), (#{p.id}, 'nonbillable_standard')
      ON CONFLICT (work_chart_id, kind_code) DO NOTHING;
    INSERT INTO work_chart_kinds_defaults (work_chart_id, kind_code)
      VALUES (#{p.id}, '#{default_kind}')
      ON CONFLICT (work_chart_id) DO NOTHING;
  SQL
end

# ---------------------------------------------------------------------
# 3. Users, roles, and permissions
# ---------------------------------------------------------------------
puts "[users] Creating demo users..."

DEMO_USERS = [
  { username: 'admin',   name: 'Admin User',        email: 'admin@example.com',   admin: true  },
  { username: 'alice',   name: 'Alice Anderson',    email: 'alice@example.com',   admin: false },
  { username: 'bob',     name: 'Bob Baker',         email: 'bob@example.com',     admin: false },
  { username: 'charlie', name: 'Charlie Carter',    email: 'charlie@example.com', admin: false },
  { username: 'diana',   name: 'Diana Davis',       email: 'diana@example.com',   admin: false },
  { username: 'evan',    name: 'Evan Edwards',      email: 'evan@example.com',    admin: false },
  { username: 'fiona',   name: 'Fiona Franklin',    email: 'fiona@example.com',   admin: false },
  { username: 'george',  name: 'George Griffin',    email: 'george@example.com',  admin: false },
  { username: 'hannah',  name: 'Hannah Harris',     email: 'hannah@example.com',  admin: false },
  { username: 'isaac',   name: 'Isaac Ingram',      email: 'isaac@example.com',   admin: false },
].freeze

created_users = DEMO_USERS.map do |u|
  role = Role.find_or_create_by!(code: "user_#{u[:username]}") do |r|
    r.display_label = "User: #{u[:name]}"
    r.description = "Auto-generated role for #{u[:name]}"
    r.last_modified = NOW
  end

  user = User.find_or_create_by!(username: u[:username]) do |usr|
    usr.email = u[:email]
    usr.name = u[:name]
    usr.password = 'please1234'
    usr.password_confirmation = 'please1234'
    usr.time_zone_code = 'US/Eastern'
    usr.start_date = 1.year.ago
    usr.status_code = 'enabled'
    usr.role_id = role.id
  end

  if u[:admin]
    superuser_rt = RightType.find_by!(code: 'superuser')
    unless Right.exists?(role_id: role.id, right_type_id: superuser_rt.id)
      Right.create!(
        role_id: role.id,
        right_type_id: superuser_rt.id,
        is_granted: true,
        date_created: NOW,
        last_modified: NOW,
      )
    end

    # The "Remaining hours" calendar panel is gated behind new_features_tester.
    # Role#has_right_to deliberately excludes this right from the superuser
    # shortcut, so it must be granted explicitly for admin to see the panel.
    tester_rt = RightType.find_by!(code: 'new_features_tester')
    unless Right.exists?(role_id: role.id, right_type_id: tester_rt.id)
      Right.create!(
        role_id: role.id,
        right_type_id: tester_rt.id,
        is_granted: true,
        date_created: NOW,
        last_modified: NOW,
      )
    end
  end

  user
end

# Groups. A row in roles_has_roles means "role_id belongs to has_role_id", so
# pointing a user's own role at a group role makes that user a member of it.
#
# The tree is two levels deep on purpose. Nobody has a row placing them in All
# Staff except Isaac, yet everyone below counts as a member of it, because
# roles_view walks the hierarchy and folds ancestors into each role's
# role_ids. That inherited case is the one the Groups editor has to show
# differently from a direct membership, so the seed has to produce both.
#
#   All Staff
#     |-- Engineering   alice, bob, charlie, george
#     |-- Management    admin, fiona
#     |-- Support       diana, evan, hannah
#     +-- (direct)      isaac
#
# Note these are groups, not teams: the teams view only counts roles that
# belong to a role coded 'operational', which none of these do.
DEMO_GROUPS = [
  { code: 'all_staff',   label: 'All Staff',   parent: nil,         members: %w[isaac] },
  { code: 'engineering', label: 'Engineering', parent: 'all_staff', members: %w[alice bob charlie george] },
  { code: 'management',  label: 'Management',  parent: 'all_staff', members: %w[admin fiona] },
  { code: 'support',     label: 'Support',     parent: 'all_staff', members: %w[diana evan hannah] },
].freeze

puts "[groups] Creating demo groups..."

# roles_has_roles has no primary key and no Rails timestamps, so build the row
# the way the app's own Users::UpdateGroup interaction does.
link_role = lambda do |member_id, group_id|
  next if RoleHasRole.exists?(role_id: member_id, has_role_id: group_id)

  link = RoleHasRole.new
  link.role_id = member_id
  link.has_role_id = group_id
  link.date_created = link.last_modified = NOW
  link.save!
end

demo_groups = DEMO_GROUPS.each_with_object({}) do |g, acc|
  acc[g[:code]] = Role.find_or_create_by!(code: g[:code]) do |r|
    r.display_label = g[:label]
    r.description = "Demo group: #{g[:label]}"
    r.last_modified = NOW
  end
end

DEMO_GROUPS.each do |g|
  group = demo_groups[g[:code]]
  link_role.call(group.id, demo_groups[g[:parent]].id) if g[:parent]

  g[:members].each do |username|
    member = created_users.find { |u| u.username == username }
    link_role.call(member.role_id, group.id)
  end
end

# Hours-in-the-bank budgets (created in section 5). Each is a billable client
# project with a bought/used pair chosen to land in one color band of the
# "Remaining hours" panel: green (>=16h left), orange (0-16h), red (<=0h).
DEMO_BUDGETS = [
  { chart: 'Website Redesign', bought: 40, used: 5,  note: 'green (plenty left)'  },
  { chart: 'Mobile App',       bought: 20, used: 12, note: 'orange (running low)' },
  { chart: 'Client Support',   bought: 8,  used: 14, note: 'red (over budget)'    },
].freeze
budget_chart_names = DEMO_BUDGETS.map { |b| b[:chart] }

# ---------------------------------------------------------------------
# 4. Work entries (50 entries, spread across users, projects, last 30d)
# ---------------------------------------------------------------------
puts "[entries] Creating demo work entries..."

user_roles = created_users.map(&:role_id)
# Keep random filler entries off the budget charts so their "used" totals stay
# deterministic — section 5 logs exactly the usage each budget needs.
random_leaves = leaves.reject { |c| budget_chart_names.include?(c.display_label) }
duration_codes = %w[billable_standard nonbillable_standard]
descriptions = [
  'Scoping and requirements',
  'Feature implementation',
  'Bug investigation',
  'Code review',
  'Meeting with stakeholders',
  'Documentation update',
  'Deployment and release',
  'Customer support call',
]

entries_to_create = 50 - WorkEntry.count
entries_to_create = 0 if entries_to_create.negative?

entries_to_create.times do |i|
  chart = random_leaves.sample
  role_id = user_roles.sample
  date = rand(30.days.ago.to_date..Date.today)
  kind_code = other_leaves.include?(chart) ? 'nonbillable_standard' : duration_codes.sample

  entry = WorkEntry.create!(
    work_chart_id: chart.id,
    role_id: role_id,
    date_performed: date,
    description: descriptions.sample,
    date_created: NOW,
    last_modified: NOW,
  )

  WorkEntryDuration.create!(
    work_entry_id: entry.id,
    kind_code: kind_code,
    duration: "#{rand(1..4)}:#{['00','15','30','45'].sample}:00",
    date_created: NOW,
    last_modified: NOW,
    # production_category_id auto-populated by DB trigger from kind_code
    production_category_id: ProductionCategory.first.id,
  )
end

# ---------------------------------------------------------------------
# 5. Hours-in-the-bank budgets ("Remaining hours" calendar panel)
# ---------------------------------------------------------------------
# The panel reads the hours_in_the_bank view: hours bought (a transaction
# against a work chart) minus hours used (work entries under it). With no
# transactions the view is empty and the panel never renders. Seed one budget
# per color band, using admin's own logged time as the "used" side so each
# appears for admin (the view exposes each budget only to roles that logged
# against it).
puts "[budget] Creating demo hours-in-the-bank budgets..."

admin_user    = created_users.first
pcat_id       = ProductionCategory.first.id
txn_date      = 60.days.ago.to_date  # opens the budget well before any usage
usage_date    = 15.days.ago.to_date  # within the open budget window and <= today

DEMO_BUDGETS.each do |b|
  chart = client_leaves.find { |c| c.display_label == b[:chart] }

  # Admin's logged time = the "used" side. billable_standard matches the
  # 'billable' budget kind through the view's kind_code-prefix join.
  entry = WorkEntry.find_or_create_by!(
    work_chart_id: chart.id,
    role_id: admin_user.role_id,
    date_performed: usage_date,
    description: "Demo budget usage - #{b[:note]}",
  ) do |e|
    e.date_created  = NOW
    e.last_modified = NOW
  end

  WorkEntryDuration.find_or_create_by!(work_entry_id: entry.id, kind_code: 'billable_standard') do |d|
    # WorkEntryDuration#duration= takes an integer number of minutes
    # (Interval.new(duration.to_i)), so convert the budget's used hours.
    d.duration               = b[:used] * 60
    d.production_category_id  = pcat_id
    d.date_created           = NOW
    d.last_modified          = NOW
  end

  # Hours bought = an open-ended cumulative transaction so the budget stays
  # active. kind_code 'billable' is the mode the panel shows for the row.
  Transaction.find_or_create_by!(work_chart_id: chart.id, kind_code: 'billable') do |t|
    t.hours       = b[:bought]
    t.date        = txn_date
    t.mode        = 'cumulative'
    t.user_id     = admin_user.id
    t.description  = "Demo budget - #{b[:note]}"
  end
end

puts "=== Seeding complete ==="
puts "  WorkCharts:     #{WorkChart.count}"
puts "  Users:          #{User.count}"
puts "  Roles:          #{Role.count}"
puts "  Groups:         #{DEMO_GROUPS.count} (#{RoleHasRole.count} memberships)"
puts "  WorkEntries:    #{WorkEntry.count}"
puts "  Budgets:        #{Transaction.count}"
puts "  Login:          admin@example.com / please1234"
