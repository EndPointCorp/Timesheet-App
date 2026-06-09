require 'spec_helper'

describe WorkEntries::CreateWorkEntry do
  before(:each) do
    # destroy_all_objects
    @user = FactoryBot.create :user
    FactoryBot.create :duration_kind, code: 'billable_standard'
    @parent_chart = FactoryBot.create :work_chart, id: 1
    @chart = FactoryBot.create :work_chart, parent_id: @parent_chart.id
    @params = {
      description: "I'm a test",
      fee: 0,
      user: @user,
      durations: [ { kind_code: 'billable_standard', duration: 2*60} ],
      date_performed: 1.week.ago.to_date,
      work_chart_id: @chart.id
    }
  end

  it "returns successfull when given proper data" do
    @create = WorkEntries::CreateWorkEntry.run(@params)
    @create.errors.full_messages.should == []
    WorkEntry.first.should == @create.result
  end

end
