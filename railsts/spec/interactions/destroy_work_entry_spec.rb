require 'spec_helper'

describe WorkEntries::DestroyWorkEntry do
  before(:each) do
    create_real_right_types
    create_real_groups

    @clients = create_proper_chart
    @clients.update_attributes! display_label: 'Clients'
    @perplexus = Role.where(code: "perplexus").first
    @manager = create_correct_user "manager1@endpointdev.com", roles: ["perplexus", "manager"], rights: { manage_team: [{role: @perplexus.id}] }
    @user = create_correct_user "developer1@endpointdev.com", roles: ["perplexus"]
    @user_cannot_update = create_correct_user "developer2@endpointdev.com"
    @acme = FactoryGirl.create :work_chart, parent: @clients, display_label: 'Acme'
    @acme_general = FactoryGirl.create :work_chart, parent: @acme, display_label: 'General'
    @chart = @acme_general
    @entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @chart.id, description: "YYy", fee: 0, user: @user,
      durations: [ { kind_code: 'billable_standard', duration: 10*60 } ],
      date_performed: 10.days.ago.to_date
    @params = {
      work_entry_id: @entry.id,
      user: @user
    }
  end

  it "fails for the user who is not current owner" do
    WorkEntries::ApproveEntry.run! work_entry: @entry, user: @user
    WorkEntries::DestroyWorkEntry.run(@params).errors.full_messages.should_not == []
    WorkEntries::DestroyWorkEntry.run(@params.merge({user: @manager})).errors.full_messages.should == []
  end
end

