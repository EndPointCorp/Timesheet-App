require 'spec_helper'

describe WorkCharts::AssignPMs do
  before(:each) do
    @users = FactoryGirl.create_list :user, 3
    FactoryGirl.create :work_chart, id: 1
    @chart = FactoryGirl.create :work_chart, parent_id: 1
    @params = {
      work_chart: @chart,
      users: @users
    }
  end

  it "assigns project managers to a work chart" do
    FactoryGirl.create(:right_type, code: 'naggable')
    FactoryGirl.create(:right_type, code: 'billable')
    FactoryGirl.create(:right_type, code: 'project_manage')
    @assign = WorkCharts::AssignPMs.run(@params)
    @assign.errors.full_messages.should be_empty
    @chart = WorkChart.find @chart.id
    @chart.project_managers.map(&:id).sort.should eq(@users.map(&:id).sort)
  end

end
