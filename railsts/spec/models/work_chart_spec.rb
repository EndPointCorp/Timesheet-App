require 'spec_helper'

describe WorkChart do
  describe "mass assignment for attributes" do
  end
  describe "tables relations" do
    it { should have_many(:work_chart_kind_sets) } 
    it { should have_many(:work_chart_kinds) } 
    it { should have_many(:work_entries) } 
    it { should have_many(:work_chart_kinds_defaults) } 
    it { should have_many(:children).class_name('WorkChart').with_foreign_key('parent_id') } 
    it { should have_many(:transactions) }
    it { should belong_to(:parent).class_name('WorkChart').with_foreign_key('parent_id') } 
    it { should belong_to(:work_chart_status).with_foreign_key('status') }
  end
  it "has a valid work_chart factory" do
    FactoryGirl.create(:work_chart).should be_valid
  end

  it "activates a work chart" do
    wcs = FactoryGirl.create(:work_chart_status, status: 'hidden')
    wc = FactoryGirl.create(:work_chart, status: 'hidden')
    wc.status.should eq(wcs.status)
    wcs = FactoryGirl.create(:work_chart_status, status: 'active')
    wc.activate!
    wc_new = WorkChart.find_by_id wc.id
    wc_new.status.should eq(wcs.status)
  end

end
