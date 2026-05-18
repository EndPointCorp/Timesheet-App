require "spec_helper"
describe WorkEntriesMailer do
  describe "notify_entry_changed" do
    before(:each) do 
      @root = FactoryGirl.create :work_chart, id: 1, display_label: 'Top node'
      @endpoint = FactoryGirl.create :work_chart, id: 2, display_label: 'End Point', parent_id: @root.id
      @client = FactoryGirl.create :work_chart, id: 3, display_label: 'Clients', parent_id: @endpoint.id
      @clienta = FactoryGirl.create :work_chart, id: 4, display_label: 'ClientA', parent_id: @client.id
      @entry = FactoryGirl.create(:work_entry, work_chart_id: @clienta.id)
      @user = FactoryGirl.create(:user)
      @msg = "This tests email interceptor"
      @result = WorkEntriesMailer.notify_entry_changed(@entry, @msg, @user).deliver_now
    end
  
    it "sets a subject properly" do
      ActionMailer::Base.deliveries.last.subject.should == "Your entry has been updated"
    end

    it "delivers an email to a correct recipient" do
      ActionMailer::Base.deliveries.last.to.should  == [@entry.owner.email]
    end
  end
end
