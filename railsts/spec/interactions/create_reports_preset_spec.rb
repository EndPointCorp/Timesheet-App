require 'spec_helper'

describe Reports::CreateReportsPreset do
  before(:each) do
    @user = create_correct_user 'developer1@endpointdev.com'
    FactoryBot.create :duration_kind, code: 'billable_standard'
    @clients = create_proper_chart
    @clients.update! display_label: 'Clients'
    @bar = FactoryBot.create :work_chart, parent: @clients, display_label: 'Bar'
    @bar_general = FactoryBot.create :work_chart, parent: @bar, display_label: 'General'
    @bar_ios = FactoryBot.create :work_chart, parent: @bar, display_label: 'iOS'
    @bar_ios_devel = FactoryBot.create :work_chart, parent: @bar_ios, display_label: 'Devel'
    @bar_ios_design = FactoryBot.create :work_chart, parent: @bar_ios, display_label: 'Design'
    @bar_rust = FactoryBot.create :work_chart, parent: @bar, display_label: 'Rust'
    @bar_rust_devel = FactoryBot.create :work_chart, parent: @bar_rust, display_label: 'Devel'
  end

  it 'creates the report preset with data' do
    result = Reports::CreateReportsPreset.run! user_id: @user.id,
                                      name: 'Nice report',
                                      report_type: 'break',
                                      start_date: Date.today,
                                      end_date: Date.today,
                                      work_chart_id: 2,
                                      roles: ['kamil'],
                                      description: true,
                                      show_all_roles: true,
                                      fragmentation: 'monthly',
                                      dates_relative: 'false',
                                      dates_period_type: ''
    report_preset = ReportsPreset.find result.id
    report_preset.user_id.should eq(@user.id)
    report_preset.start_date.should eq(Date.today)
    report_preset.roles.should eq(['kamil'])
    report_preset.name.should eq('Nice report')
  end
end
