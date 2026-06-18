require 'spec_helper'

# Guards the Rails 8 upgrade fixes that the manual test run caught. Each of these
# code paths had no spec, which is why a removed Ruby/Rails API slipped through.
# See report/billing.rb (BigDecimal), work_entries_controller#previous_next
# (to_fs), and lib/report_presenter.rb (PDF rendering).
describe "Rails 8 upgrade regressions" do
  before(:each) do
    @user = create_correct_user
    login_sucessfully
    grant_superuser
    @root     = FactoryBot.create :work_chart, id: 1, display_label: 'Top node'
    @endpoint = FactoryBot.create :work_chart, id: 2, display_label: 'End Point', parent_id: @root.id
    @client   = FactoryBot.create :work_chart, id: 3, display_label: 'Clients', parent_id: @endpoint.id
    FactoryBot.create :duration_kind, code: 'billable_standard'
    FactoryBot.create :duration_kind, code: 'nonbillable_standard'
  end

  # to_fs(:db) in work_entries_controller#previous_next. The old to_s(:db) raised
  # ArgumentError on Rails 8, so this endpoint 500'd.
  it "previous_next returns 200" do
    entry = WorkEntries::CreateWorkEntry.run(
      work_chart_id: @client.id, description: "entry", fee: 0, user: @user,
      durations: [{ kind_code: 'nonbillable_standard', duration: 60 }],
      date_performed: 1.week.ago.to_date,
    ).result

    get "/api/work_entries/#{entry.id}/previous_next.json"

    response.status.should == 200
    JSON.parse(response.body).keys.should include('prev_id', 'next_id')
  end

  # BigDecimal('0.0') in report/billing.rb. The old BigDecimal.new raised
  # NoMethodError on Ruby 3.3, so the billing report 500'd.
  it "billing report renders" do
    get "/api/reports/billing.html", params: report_params

    response.status.should == 200
  end

  # ApplicationController.renderer in lib/report_presenter.rb. Rails 8 rejected
  # the .html.erb template suffix and the format: option, so every report PDF 500'd.
  it "report PDF renders a real PDF" do
    get "/api/reports/billing.pdf", params: report_params

    response.status.should == 200
    response.content_type.should include('application/pdf')
  end

  def report_params
    {
      start_date: 1.month.ago.to_date.to_s,
      end_date: Date.today.to_s,
      work_chart_id: 2,
      option: 'from_selected',
      fragmentation: 'continuous',
      access: 'true',
      roles: [''],
    }
  end
end
