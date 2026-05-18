require 'spec_helper'

describe Approvals::UndoLastApproval do
  before(:each) do
    create_real_right_types
    create_real_groups

    @clients = create_proper_chart
    @clients.update_attributes! display_label: 'Clients'
    @perplexus = Role.where(code: "perplexus").first
    @manager = create_correct_user "manager1@endpointdev.com", roles: ["perplexus", "manager"], rights: { manage_team: [{role: @perplexus.id}] }
    @user = create_correct_user "developer1@endpointdev.com", roles: ["perplexus"]
    @acme = FactoryGirl.create :work_chart, parent: @clients, display_label: 'Acme'
    @acme_general = FactoryGirl.create :work_chart, parent: @acme, display_label: 'General'
    @chart = @acme_general
    @manager_acme = create_correct_user "developer2@endpointdev.com", roles: ["perplexus"], rights: { project_manage: [ { work_chart: @acme.id } ] }
    @entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @chart.id, description: "YYy", fee: 0, user: @user,
      durations: [ { kind_code: 'billable_standard', duration: 10*60 } ],
      date_performed: 10.days.ago.to_date
  end

  it "brings the approval back to the unapproved state" do
    approval = WorkEntries::ApproveEntry.run! work_entry: @entry, user: @user
    Approvals::UndoLastApproval.run! user: @user
    approval.reload
    approval.approved.should be_nil
  end

  it "deletes all approvals created when approving" do
    approval = WorkEntries::ApproveEntry.run! work_entry: @entry, user: @user
    Approvals::UndoLastApproval.run! user: @user
    @entry.approvals.where.not(id: approval.id).
      where('created_at > ?', approval.created_at).count.should == 0
  end

  it "deletes all approvals created when denying" do
    WorkEntries::ApproveEntry.run! work_entry: @entry, user: @user
    approval = WorkEntries::DenyEntry.run! work_entry: @entry, user: @manager_acme, comment: "Bad bad bad"
    Approvals::UndoLastApproval.run! user: @manager_acme
    @entry.approvals.where.not(id: approval.id).
      where('created_at > ?', approval.created_at).count.should == 0
  end

  it "fails if the approval created afterwards has been approved" do
    WorkEntries::ApproveEntry.run! work_entry: @entry, user: @user
    WorkEntries::ApproveEntry.run! work_entry: @entry, user: @manager_acme
    result = Approvals::UndoLastApproval.run user: @user
    result.errors.full_messages.should_not == []
  end

  it "fails if the approval created afterwards has been denied" do
    WorkEntries::ApproveEntry.run! work_entry: @entry, user: @user
    WorkEntries::DenyEntry.run! work_entry: @entry, user: @manager_acme, comment: "Yyy"
    result = Approvals::UndoLastApproval.run user: @user
    result.errors.full_messages.should_not == []
  end
end
