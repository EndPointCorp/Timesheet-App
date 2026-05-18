module DatabaseObjects
  def setup_basic_database_objects
    tables = {
      real_target_kinds: RightTypeTargetKind,
      real_right_types: RightType,
      real_groups: Role,
      real_group_connections: RoleHasRole,
      real_groups_rights: Right,
      real_groups_rights_targets: RightTarget
    }
    setup_data(tables)
  end

  def create_real_right_types
    tables = {
      real_target_kinds: RightTypeTargetKind,
      real_right_types: RightType,
    }
    setup_data(tables)
  end

  def create_real_groups
    tables = {
      real_groups: Role,
      real_group_connections: RoleHasRole,
      real_groups_rights: Right,
      real_groups_rights_targets: RightTarget
    }
    setup_data(tables)
  end

  def insert_basic_charts
    tables = {
      work_chart_statuses: WorkChartStatus,
      production_categories: ProductionCategory,
      duration_kinds: DurationKind,
      work_charts: WorkChart
    }
    setup_data(tables)
  end

  def setup_data(tables)
    statements = []

    $arel_silence_type_casting_deprecation = true
    silence_warnings do
      ActiveSupport::Deprecation.silence do
        tables.each do |store_name, type|
          table = type.arel_table
          examples = self.send(store_name)
          examples.each do |example|
            attributes = example.to_a.map { |pair| [table[pair.first], pair.last] }
            manager = Arel::InsertManager.new
            manager.insert(attributes)
            statements << manager.to_sql
          end
        end
      end
    end
    $arel_silence_type_casting_deprecation = false
    ActiveRecord::Base.connection.execute statements.join(";\n")
  end

  def production_categories
    [
      {
        id: 1,
        name: 'billable',
        is_excluded: false,
        is_production: true,
        date_created: DateTime.now,
        last_modified: DateTime.now
      },
      {
        id: 2,
        name: 'nonbillable',
        is_excluded: false,
        is_production: true,
        date_created: DateTime.now,
        last_modified: DateTime.now
      }
    ]
  end

  def work_chart_statuses
    [
      {
        description: 'Active',
        status: "active",
        date_created: DateTime.now,
        last_modified: DateTime.now
      }
    ]
  end

  def duration_kinds
    [
      {
        code: "billable_standard",
        production_category_id: 1,
        status: 'active',
        display_label: "Billable: Standard",
        abbr_label: "bst"
      },
      {
        code: "nonbillable_standard",
        production_category_id: 2,
        status: 'active',
        display_label: "Non-Billable: Standard",
        abbr_label: "nbst"
      }
    ]
  end

  def work_charts
    [
      {
        id: 1,
        status: 'active',
        display_label: "*Artificial Root Node"
      },
      {
        id: 2,
        display_label: "Clients",
        status: 'active',
        parent_id: 1
      },
      {
        id: 3,
        display_label: "Acme",
        status: 'active',
        parent_id: 2
      },
      {
        id: 4,
        display_label: "General",
        status: 'active',
        parent_id: 3
      },
      {
        id: 5,
        display_label: "iOS",
        status: 'active',
        parent_id: 3
      },
      {
        id: 6,
        display_label: "Development",
        status: 'active',
        parent_id: 5
      },
      {
        id: 7,
        display_label: "Design",
        status: 'active',
        parent_id: 5
      },
      {
        id: 8,
        display_label: "Rust",
        status: 'active',
        parent_id: 3
      },
      {
        id: 9,
        display_label: "Development",
        status: 'active',
        parent_id: 8
      }
    ]
  end

  def real_right_types
    [
      {
        :code=>"superuser",
        :description=>"Special right type that grants unrestricted access",
        :display_label=>"Unrestricted Access",
        :id=>1,
        :target_kind_code=>nil
      },
      {
        :code=>"access_site_mgmt",
        :description=>"Determines access to the site management facility",
        :display_label=>"Access: Site Management",
        :id=>2,
        :target_kind_code=>nil
      },
      {
        :code=>"switch_user",
        :description=>"Determines right to become a different user (bypassing login form)",
        :display_label=>"Switch to Different User",
        :id=>4,
        :target_kind_code=>"user"
      },
      {
        :code=>"report",
        :description=>"",
        :display_label=>"Reporting right on work chart",
        :id=>8,
        :target_kind_code=>"work_chart"
      },
      {
        :code=>"manage",
        :description=>"",
        :display_label=>"Manage other roles",
        :id=>5,
        :target_kind_code=>"role"
      },
      {
        :code=>"manage_team",
        :description=>"",
        :display_label=>"Manage teams",
        :id=>105,
        :target_kind_code=>"role"
      },
      {
        :code=>"bill",
        :description=>"",
        :display_label=>"Able to bill time",
        :id=>6,
        :target_kind_code=>nil
      },
        {
        :code=>"bill",
        :description=>"",
        :display_label=>"Bill time to specific work chart nodes",
        :id=>7,
        :target_kind_code=>"work_chart"
      },
      {
        :code=>"access_control",
        :description=>"",
        :display_label=>"Allows creating users and changing permissions",
        :id=>9,
        :target_kind_code=>nil
      },
        {
        :code=>"naggable",
        :description=>"",
        :display_label=>"Naggable right",
        :id=>10,
        :target_kind_code=>nil
      },
        {
        :code=>"accounts_overview",
        :description=>"",
        :display_label=>"See account management page",
        :id=>13,
        :target_kind_code=>nil
      },
        {
        :code=>"view_account",
        :description=>"",
        :display_label=>"View account details",
        :id=>14,
        :target_kind_code=>"account"
      },
      {
        :code=>"edit_account",
        :description=>"",
        :display_label=>"Manage account",
        :id=>15,
        :target_kind_code=>"account"
      },
      {
        :code=>"manage",
        :description=>"",
        :display_label=>"Manage work chart nodes",
        :id=>17,
        :target_kind_code=>"work_chart"
      },
      {
        :code=>"report",
        :description=>"",
        :display_label=>"Report on roles",
        :id=>18,
        :target_kind_code=>"role"
      },
      {
        :code=>"execute",
        :description=>"Determines right to execute site management action",
        :display_label=>"Execute: Site Management Action",
        :id=>3,
        :target_kind_code=>"site_mgmt_action"
      },
      {
        :code=>"create_users",
        :description=>"",
        :display_label=>"Create Users",
        :id=>19,
        :target_kind_code=>nil
      },
        {
        :code=>"represent",
        :description=>"Represents a client / chart",
        :display_label=>"Represent",
        :id=>20,
        :target_kind_code=>"work_chart"
      },
      {
        :code=>"project_manage",
        :description=>"Manages a client / chart",
        :display_label=>"Project manage",
        :id=>21,
        :target_kind_code=>"work_chart"
      },
      {
        :code=>"get_nag_emails_for_project_manager",
        :description=>"Receives nag emails for project manager",
        :display_label=>"Get nag emails for project manager",
        :id=>22,
        :target_kind_code=>"work_chart"
      },
      {
        :code=>"get_nag_emails_for_project",
        :description=>"Receives nag emails for work charts",
        :display_label=>"Get nag emails for project",
        :id=>23,
        :target_kind_code=>"work_chart"
      },
      {
        :code=>"get_nag_emails_for_team",
        :description=>"Receives nag emails for team",
        :display_label=>"Get nag emails for team",
        :id=>24,
        :target_kind_code=>"role"
      },
      {
        :code=>"global_reviewer",
        :description=>"Reviews timesheets",
        :display_label=>"Global timesheet reviewer",
        :id=>26,
        :target_kind_code=>"role"
      }
    ]
  end

  def real_target_kinds
    [ 
      {:code=>"user", :display_label=>"User", :model_class=>"IC::M::User", :relation_name=>"users"},
      {:code=>"role", :display_label=>"Role", :model_class=>"Role", :relation_name=>"roles"},
      {:code=>"work_chart", :display_label=>"Work Chart", :model_class=>"EndPoint::M::WorkChart", :relation_name=>"work_chart"},
      {:code=>"account", :display_label=>"Account", :model_class=>"EndPoint::M::Account", :relation_name=>"accounts"},
      {:code=>"site_mgmt_action", :display_label=>"Site Mgmt Action", :model_class=>"IC::M::ManageClass::Action", :relation_name=>"ic_manage_class_actions"}
    ]
  end

  def real_group_connections
    [ 
      {:has_role_id=>1, :role_id=>4},
      {:has_role_id=>10, :role_id=>11},
      {:has_role_id=>10, :role_id=>12},
      {:has_role_id=>9, :role_id=>13},
      {:has_role_id=>9, :role_id=>14},
      {:has_role_id=>9, :role_id=>15},
      {:has_role_id=>9, :role_id=>16},
      {:has_role_id=>9, :role_id=>17},
      {:has_role_id=>9, :role_id=>18},
      {:has_role_id=>9, :role_id=>19},
      {:has_role_id=>9, :role_id=>20},
      {:has_role_id=>9, :role_id=>21},
      {:has_role_id=>7, :role_id=>25},
      {:has_role_id=>7, :role_id=>26},
      {:has_role_id=>7, :role_id=>24},
      {:has_role_id=>7, :role_id=>173},
      {:has_role_id=>10, :role_id=>81},
      {:has_role_id=>81, :role_id=>6},
      {:has_role_id=>82, :role_id=>7},
      {:has_role_id=>82, :role_id=>8},
      {:has_role_id=>82, :role_id=>9},
      {:has_role_id=>6, :role_id=>84},
      {:has_role_id=>1, :role_id=>86},
      {:has_role_id=>7, :role_id=>136},
      {:has_role_id=>7, :role_id=>178},
      {:has_role_id=>7, :role_id=>179},
      {:has_role_id=>9, :role_id=>154},
      {:has_role_id=>7, :role_id=>182},
      {:has_role_id=>7, :role_id=>183},
      {:has_role_id=>82, :role_id=>168},
      {:has_role_id=>7, :role_id=>171},
      {:has_role_id=>7, :role_id=>126},
      {:has_role_id=>7, :role_id=>111},
      {:has_role_id=>7, :role_id=>170},
      {:has_role_id=>7, :role_id=>122},
      {:has_role_id=>7, :role_id=>198},
      {:has_role_id=>7, :role_id=>204}
    ]
  end

  def real_groups
    [ {:code=>"ic_site_mgr", :description=>"Group role centered around IC site management interface", :display_label=>"IC Site Manager", :id=>1},
      {:code=>"ic_site_mgr_developer", :description=>"", :display_label=>"IC Site Mgr: Developer", :id=>4},
      {:code=>"director", :description=>"", :display_label=>"Directors", :id=>6},
      {:code=>"operational", :description=>"", :display_label=>"Operational team grouping", :id=>7},
      {:code=>"by_client", :description=>"", :display_label=>"Client-oriented team grouping", :id=>8},
      {:code=>"by_focus", :description=>"", :display_label=>"Skill/technical team grouping", :id=>9},
      {:code=>"staff", :description=>"", :display_label=>"General grouping for staff", :id=>10},
      {:code=>"technical_staff", :description=>"", :display_label=>"Technically-oriented staff", :id=>11},
      {:code=>"admin_staff", :description=>"", :display_label=>"Administrative staff", :id=>12},
      {:code=>"hosting", :description=>"", :display_label=>"Hosting team", :id=>13},
      {:code=>"sales", :description=>"", :display_label=>"Sales team", :id=>14},
      {:code=>"interchange", :description=>"", :display_label=>"Interchange team", :id=>15},
      {:code=>"rails", :description=>"", :display_label=>"Rails team", :id=>16},
      {:code=>"spree", :description=>"", :display_label=>"Spree team", :id=>17},
      {:code=>"postgres", :description=>"", :display_label=>"Postgres team", :id=>18},
      {:code=>"openafs", :description=>"", :display_label=>"OpenAFS team", :id=>19},
      {:code=>"timesheet", :description=>"", :display_label=>"Timesheet team", :id=>20},
      {:code=>"camps", :description=>"", :display_label=>"Camps team", :id=>21},
      {:code=>"mostly_harmless", :description=>"", :display_label=>"Mostly Harmless", :id=>22},
      {:code=>"team_slipstick", :description=>"", :display_label=>"Team Slipstick", :id=>23},
      {:code=>"team_42", :description=>"", :display_label=>"Team-42", :id=>24},
      {:code=>"vogons", :description=>"", :display_label=>"Vogons", :id=>26},
      {:code=>"magratheans", :description=>"", :display_label=>"Magratheans", :id=>88},
      {:code=>"user", :description=>"Group role to which all users are assigned by default", :display_label=>"User", :id=>0},
      {:code=>"improbability", :description=>"", :display_label=>"Improbability", :id=>25},
      {:code=>"biller", :description=>"", :display_label=>"\"Group\" role for roles that bill", :id=>80},
      {:code=>"manager", :description=>"", :display_label=>"Base management role", :id=>81},
      {:code=>"teams", :description=>"", :display_label=>"Base role for teams", :id=>82},
      {:code=>"engineer", :description=>"", :display_label=>"Roles that do engineering", :id=>83},
      {:code=>"officer", :description=>"", :display_label=>"Officers", :id=>84},
      {:code=>"site_mgr_account_maintenance", :description=>"", :display_label=>"Site Manager: Account Maintenance", :id=>86},
      {:code=>"non_management", :description=>"", :display_label=>"Non-Management", :id=>110},
      {:code=>"perplexus", :description=>"", :display_label=>"Perplexus", :id=>111},
      {:code=>"misc_team", :description=>"", :display_label=>"Misc. team", :id=>122},
      {:code=>"lg_content", :description=>"", :display_label=>"LG Content Team", :id=>126},
      {:code=>"team_rick", :description=>"", :display_label=>"Team Rick", :id=>136},
      {:code=>"cbre", :description=>"Team for CBRE Client", :display_label=>"CBRE Team", :id=>154},
      {:code=>"lg_rnd_team", :description=>"", :display_label=>"LG R&D Team", :id=>168},
      {:code=>"invoicer", :description=>"A user who is the last one in the chain of reviewers of entries and marks them as invoiced", :display_label=>"Invoicer", :id=>169},
      {:code=>"dontpanic", :description=>"", :display_label=>"Don't Panic", :id=>170},
      {:code=>"ben_timesheet_group", :description=>"", :display_label=>"Ben's timesheet group", :id=>171},
      {:code=>"megadodo", :description=>"", :display_label=>"Megadodo", :id=>173},
      {:code=>"lg_sales", :description=>"", :display_label=>"LG Sales Team", :id=>178},
      {:code=>"team_josh", :description=>"", :display_label=>"Team Josh", :id=>179},
      {:code=>"radians", :description=>"", :display_label=>"Radians", :id=>182},
      {:code=>"tangents", :description=>"", :display_label=>"Tangents", :id=>183},
      {:code=>"perusion", :description=>"", :display_label=>"Perusion", :id=>198},
      {:code=>"lg_installation_team", :description=>"LG installation team", :display_label=>"LG Installation Team", :id=>204}]
  end

  def real_groups_rights
    [ {:id=>2, :is_granted=>true, :right_type_id=>2, :role_id=>1},
      {:id=>3, :is_granted=>true, :right_type_id=>3, :role_id=>4},
      {:id=>86, :is_granted=>true, :right_type_id=>6, :role_id=>80},
      {:id=>62, :is_granted=>true, :right_type_id=>10, :role_id=>80},
      {:id=>88, :is_granted=>true, :right_type_id=>1, :role_id=>81},
      {:id=>87, :is_granted=>true, :right_type_id=>18, :role_id=>81},
      {:id=>209, :is_granted=>true, :right_type_id=>19, :role_id=>13},
      {:id=>218, :is_granted=>true, :right_type_id=>10, :role_id=>168},
      {:id=>76, :is_granted=>true, :right_type_id=>17, :role_id=>18},
      {:id=>77, :is_granted=>true, :right_type_id=>8, :role_id=>18},
      {:id=>90, :is_granted=>true, :right_type_id=>3, :role_id=>86},
      {:id=>106, :is_granted=>true, :right_type_id=>3, :role_id=>1},
      {:id=>204, :is_granted=>true, :right_type_id=>8, :role_id=>154}]
  end

  def real_groups_rights_targets
    [ {:id=>15, :ref_obj_pk=>"10", :right_id=>3},
      {:id=>82, :ref_obj_pk=>"10", :right_id=>87},
      {:id=>19, :ref_obj_pk=>"11", :right_id=>3},
      {:id=>17, :ref_obj_pk=>"12", :right_id=>3},
      {:id=>18, :ref_obj_pk=>"13", :right_id=>3},
      {:id=>16, :ref_obj_pk=>"14", :right_id=>3},
      {:id=>594, :ref_obj_pk=>"4556", :right_id=>204},
      {:id=>411, :ref_obj_pk=>"32", :right_id=>106},
      {:id=>412, :ref_obj_pk=>"31", :right_id=>106},
      {:id=>413, :ref_obj_pk=>"30", :right_id=>106},
      {:id=>300, :ref_obj_pk=>"3109", :right_id=>76},
      {:id=>301, :ref_obj_pk=>"3109", :right_id=>77},
      {:id=>337, :ref_obj_pk=>"2", :right_id=>90},
      {:id=>339, :ref_obj_pk=>"3", :right_id=>90},
      {:id=>341, :ref_obj_pk=>"4", :right_id=>90},
      {:id=>340, :ref_obj_pk=>"5", :right_id=>90},
      {:id=>10, :ref_obj_pk=>"20", :right_id=>3},
      {:id=>14, :ref_obj_pk=>"21", :right_id=>3},
      {:id=>12, :ref_obj_pk=>"22", :right_id=>3},
      {:id=>13, :ref_obj_pk=>"23", :right_id=>3},
      {:id=>11, :ref_obj_pk=>"24", :right_id=>3}]
  end
end
