FactoryGirl.define do

  sequence :email do |n|
    "user#{n}@endpointdev.com"
  end

  sequence :role_id do |n|
    n
  end

  sequence :role_code do |n|
    "user_tester#{n}"
  end

  sequence :role_display_label do |n|
    "User: Tester#{n}"
  end

  sequence :client_name do |n|
    "TestClient#{n}"
  end

  sequence :client_wiki_url do |n|
    "https://wiki.endpointdev.com/wiki/testclient#{n}"
  end

  factory :time_zone, class: TimeZone do
    date_created { DateTime.now }
    last_modified { DateTime.now }
    code 'US/Eastern'
    utc_offset(-5)
    is_visible true
  end

  factory :right_type, class: RightType do
    code 'billable'
    display_label 'Able to bill'
    date_created { DateTime.now }
    last_modified { DateTime.now }
    target_kind_code 'user'
    before(:create) do |rt|
      unless rt.target_kind_code.nil? || RightTypeTargetKind.find_by_code(rt.target_kind_code)
        FactoryGirl.create :right_type_target_kind, code: rt.target_kind_code, display_label: rt.target_kind_code.humanize
      end
    end
  end

  factory :right_type_target_kind, class: RightTypeTargetKind do
    date_created { DateTime.now }
    last_modified { DateTime.now }
    code 'user'
    display_label 'User'
    model_class 'User'
    relation_name 'users'
  end

  factory :right, class: Right do
    is_granted true
    date_created { DateTime.now }
    last_modified { DateTime.now }

    factory :right_superuser do
      association :right_type, factory: :right_type, code: 'superuser'
    end

    factory :right_new_feature_tester do
      association :right_type, factory: :right_type, code: 'new_features_tester'
    end
  end

  factory :right_target, class: RightTarget do
    date_created { DateTime.now }
    last_modified { DateTime.now }
  end

  factory :role_has_role, class: RoleHasRole do
    date_created { DateTime.now }
    last_modified { DateTime.now }

    factory :role_has_role_with_immediate_superuser do
      has_role_id { FactoryGirl.create(:role_with_immediate_superuser).id }
    end
  end

  factory :role, class: Role do
    date_created { DateTime.now }
    last_modified { DateTime.now }
    code { generate :role_code }
    display_label { generate :role_display_label }
    description { "Role description" }

    transient do
      email { generate :email }
      status_code 'enabled'
      gen_user true
    end

    after(:create) do |role, evaluator|
      if evaluator.gen_user
        FactoryGirl.create :user, role_id: role.id, gen_role: false, email: evaluator.email,
          status_code: evaluator.status_code
      end
    end

    factory :role_with_immediate_superuser do
      after(:create) do |role, evaluator|
        role.rights << FactoryGirl.create(:right_superuser, role_id: role.id)
        role.save
      end
    end

    factory :role_with_nonimmediate_superuser do
      after(:create) do |role, evaluator|
        role.role_has_roles = [
          FactoryGirl.build(:role_has_role_with_immediate_superuser)
        ]
        role.rights << FactoryGirl.create(:right_new_feature_tester, role_id: role.id)
        role.save
      end
    end
  end

  factory :user_status, class: UserStatus do
    date_created { DateTime.now }
    last_modified { DateTime.now }
    code {
      'enabled'
    }
    display_label {
      code.camelize
    }
  end

  sequence :username do |n|
    "user#{(97 + n % 25).chr * ((n / 25) + 1)}"
  end

  factory :user do
    email { generate :email }
    username { generate :username }
    password "zaq12wsx"
    password_confirmation "zaq12wsx"
    time_zone_code 'US/Eastern'
    start_date { 1.year.ago }
    status_code 'enabled'

    transient do
      gen_role true
    end

    factory :user_with_immediate_superuser do
      gen_role false
      before(:create) do |user, evaluator|
        user.role = FactoryGirl.create :role_with_immediate_superuser, email: user.email,
          status_code: user.status_code, gen_user: false
        user.role_id = user.role.id
        user.save
      end
    end

    factory :user_with_nonimmediate_superuser do
      gen_role false
      before(:create) do |user, evaluator|
        user.role = FactoryGirl.create :role_with_nonimmediate_superuser, email: user.email,
          status_code: user.status_code, gen_user: false
        user.role_id = user.role.id
        user.save
      end
    end

    before(:create) do |user, evaluator|
      FactoryGirl.create(:user_status, code: 'enabled') if UserStatus.where(code: 'enabled').count == 0
      FactoryGirl.create(:user_status, code: 'disabled') if UserStatus.where(code: 'disabled').count == 0

      FactoryGirl.create(:time_zone, code: 'US/Eastern') if TimeZone.where(code: 'US/Eastern').count == 0
      if evaluator.gen_role
        user.role = FactoryGirl.create :role, email: user.email, gen_user: false
        user.role_id = user.role.id
        user.save
      end
    end
  end

  factory :duration_kind do
    code 'nonbillable_standard'
    date_created { DateTime.now }
    last_modified { DateTime.now }
    status 1
    display_label { "#{code.split('_').first == 'billable' ? 'Billable' : 'Non-billable'} #{code.split('_').last.camelize}" }
    abbr_label { "#{code.split('_').first == 'billable' ? 'B' : 'NB'}#{code.split('_').last.chr.capitalize}" }
    production_category_id {
      p = ProductionCategory.first
      if p
        p.id
      else
        FactoryGirl.create(:production_category).id
      end
    }
  end

  factory :message do
    author { User.first || FactoryGirl.build(:user) }
    recipient { User.first || FactoryGirl.build(:user) }
    body 'Test'
    type 'Message'
  end

  factory :billable_standard_duration_kind, parent: :duration_kind do
    code 'billable_standard'
    abbr_label 'BS'
  end

  factory :client do
    sequence(:name) { |n| "client#{n}" }
    wiki_url { "https://wiki.endpointdev.com/wiki/#{name}" }
    work_chart_id {
      WorkChart.count > 0 ? WorkChart.last.id : FactoryGirl.create(:work_chart).id
    }
    hours 0.0
    threshold_type "absolute"
    threshold_value 10.0
  end

  factory :work_entry_duration do
    transient do
      type :nonbillable
    end
    date_created { DateTime.now }
    last_modified { DateTime.now }
    production_category_id {
      ProductionCategory.count > 0 ? ProductionCategory.last.id : FactoryGirl.create(:production_category).id
    }
    kind_code {
      code = "#{type}_standard"
      if DurationKind.where(code: code).count == 0
        FactoryGirl.create :duration_kind, code: code
      end
      code
    }
    duration '01:00:00'
  end

  sequence :chart_label do |n|
    "Chart #{n}"
  end

  factory :work_chart_kind_set do
    sequence(:id, 200) { |n| n }
    work_chart_id nil
  end

  factory :work_chart_kinds_default do
    work_chart_id nil
    kind_code 'billable_standard'
  end

  factory :work_chart_kind do
    work_chart_id nil
    kind_code 'billable_standard'
  end

  factory :work_chart do
    sequence(:id, 100) { |n| n }
    display_label { generate :chart_label }
    parent_id nil
    branch_order 0
    status {
      'active'
    }
    date_created { DateTime.now }
    before(:create) { |work_chart|
      unless WorkChartStatus.where(status: work_chart.status).count > 0
        FactoryGirl.create :work_chart_status, status: work_chart.status
      end
    }

    factory :clients_parent_node_work_chart do
      display_label 'Clients'

      after(:build) do |work_chart, evaluator|
        work_chart.parent ||= WorkChart.where(id: 1).first ||
          build(:root_work_chart)
      end

      after(:create) do |work_chart, evaluator|
        if DurationKind.where(code: 'billable_standard').empty?
          FactoryGirl.create :duration_kind, code: 'billable_standard'
        end
        work_chart.work_chart_kind_sets << FactoryGirl.create(:work_chart_kind_set,
          work_chart_id: work_chart.id)
        FactoryGirl.create :work_chart_kind,
          work_chart_id: work_chart.id, kind_code: 'billable_standard'
        FactoryGirl.create :work_chart_kinds_default,
          work_chart_id: work_chart.id, kind_code: 'billable_standard'
      end
    end

    factory :client_work_chart do
      before(:create) do |work_chart, evaluator|
        work_chart.parent ||= WorkChart.where(display_label: 'Clients').first ||
          create(:clients_parent_node_work_chart)
      end
    end

    factory :root_work_chart do
      id 1
      display_label 'End Point Corporation'
    end
  end

  factory :transaction do
    date DateTime.now.strftime('%Y/%m/%d')
    date_closed nil
    hours 10
    description "My transaction"
    user_id { User.count > 0 ? User.last.id : FactoryGirl.create(:user).id }
    mode :cumulative

    factory :monthly_recurring_transaction do
      recur_at CronSpec.load("0,0,1,,,")
    end

    before(:create) do |transaction, _|
      if transaction.work_chart_id.nil?
        transaction.work_chart = FactoryGirl.create :client_work_chart
      end
    end
  end

  factory :work_chart_status do
    status 'active'
    date_created { DateTime.now }
    last_modified { DateTime.now }
  end

  factory :work_entry_status do
    code 'unconfirmed'
    display_label 'Unconfirmed'
    date_created { DateTime.now }
    last_modified { DateTime.now }
  end

  factory :production_category do
    name 'billable'
    is_excluded false
    is_production true
    date_created { DateTime.now }
    last_modified { DateTime.now }
  end

  factory :work_entry do
    date_created { DateTime.now }
    last_modified { DateTime.now }
    description 'Lorem ipsum dolor sit amet'
    work_chart_id { WorkChart.count > 0 ? WorkChart.last.id : FactoryGirl.create(:work_chart).id }
    role_id {
      Role.count > 0 ? Role.last.id : FactoryGirl.create(:role).id
    }

    transient do
      duration_total 60
      type :billable
      between_start 1.month.ago
      between_end 0.months.ago
      has_many_durations false
    end

    date_performed { rand(between_start..between_end) }

    work_entry_durations {
      if has_many_durations
        [FactoryGirl.build(:work_entry_duration, duration: duration_total, type: 'billable'),
          FactoryGirl.build(:work_entry_duration, duration: duration_total, type: 'nonbillable')]
      else
        build_list(:work_entry_duration, 1, duration: duration_total, type: type )
      end
    }
    before(:create) do |work_entry|
      isUser = User.find_by_role_id work_entry.role_id
      if(!isUser)
        user = FactoryGirl.create(:user)
        user.role_id = work_entry.role_id
        user.save
      end
    end
  end

  factory :work_entry_audit do
    date_created { DateTime.now }
    last_modified { DateTime.now }
    description 'Lorem ipsum dolor sit amet'
    work_chart_id { WorkChart.count > 0 ? WorkChart.last.id : FactoryGirl.create(:work_chart).id }
    role_id {
      Role.count > 0 ? Role.last.id : FactoryGirl.create(:role).id
    }
    work_entries_id { WorkEntry.count > 0 ? WorkEntry.last.id : FactoryGirl.create(:work_entry).id }
    audit_timestamp { DateTime.now }

    transient do
      duration_total 60
      type :billable
      between_start 1.month.ago
      between_end 0.months.ago
      has_many_durations false
    end

    date_performed { rand(between_start..between_end) }
  end

  factory :team do
    role { Role.count > 0 ? Role.last : FactoryGirl.create(:role) }
  end

  factory :review do
    current_deadline (DateTime.now + 1.year)
    main_deadline (DateTime.now + 1.year )
    created_at DateTime.now
    updated_at DateTime.now
  end

  factory :reports_preset do
    user_id { User.count > 0 ? User.last.id : FactoryGirl.create(:user) }
    name 'Nice report'
    report_type 'break'
    start_date Date.today
    end_date Date.today
    work_chart_id 2
    roles ['kamil']
    description true
    show_all_roles true
    fragmentation 'monthly'
    dates_relative 'false'
    dates_period_type ''
  end
end
