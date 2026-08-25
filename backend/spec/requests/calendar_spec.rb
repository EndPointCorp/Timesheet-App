require 'spec_helper'

# The only request-level coverage of the calendar endpoints. Both build raw SQL
# from an interpolated date range, which can only fail end-to-end.
describe "Calendar endpoints" do
  before(:each) do
    @user = create_correct_user
    login_sucessfully
    grant_superuser
    @root     = FactoryBot.create :work_chart, id: 1, display_label: 'Top node'
    @endpoint = FactoryBot.create :work_chart, id: 2, display_label: 'End Point', parent_id: @root.id
    @client   = FactoryBot.create :work_chart, id: 3, display_label: 'Clients', parent_id: @endpoint.id
    FactoryBot.create :duration_kind, code: 'billable_standard'
    FactoryBot.create :duration_kind, code: 'nonbillable_standard'

    @date = Date.new(2024, 3, 15)
    outcome = WorkEntries::CreateWorkEntry.run(
      work_chart_id: @client.id, description: "calendar entry", fee: 0, user: @user,
      durations: [{ kind_code: 'nonbillable_standard', duration: 60 }],
      date_performed: @date,
    )
    outcome.should be_valid
  end

  it "calendar endpoint returns 200 with the day's entry" do
    get "/api/work_days/calendar/#{@date.year}/#{@date.month}.json"

    response.status.should == 200
    days = JSON.parse(response.body)
    day  = days.find { |d| d['date'] == @date.to_s }
    day.should_not be_nil
    day['time'].should == 60
    day['has_entries'].should be_truthy
  end

  it "work_months endpoint returns 200 with the month's total" do
    get "/api/work_months/#{@date.beginning_of_month}/#{@date.end_of_month}.json"

    response.status.should == 200
    months = JSON.parse(response.body)
    month  = months.find { |m| m['year'] == @date.year && m['month'] == @date.month }
    month.should_not be_nil
    month['total'].should == 60
    month['nonbillable_total'].should == 60
  end
end