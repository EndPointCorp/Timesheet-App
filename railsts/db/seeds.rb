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
  # ActiveRecord cannot execute. Strip them; the rest is plain SQL.
  clean = raw.lines.reject { |l| l.start_with?('\\') }.join
  ActiveRecord::Base.connection.execute(clean)
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
  end

  user
end

# ---------------------------------------------------------------------
# 4. Work entries (50 entries, spread across users, projects, last 30d)
# ---------------------------------------------------------------------
puts "[entries] Creating demo work entries..."

user_roles = created_users.map(&:role_id)
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
  chart = leaves.sample
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

puts "=== Seeding complete ==="
puts "  WorkCharts:     #{WorkChart.count}"
puts "  Users:          #{User.count}"
puts "  Roles:          #{Role.count}"
puts "  WorkEntries:    #{WorkEntry.count}"
puts "  Login:          admin@example.com / please1234"
