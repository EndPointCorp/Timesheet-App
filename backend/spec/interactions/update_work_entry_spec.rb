require 'spec_helper'

describe WorkEntries::UpdateWorkEntry do
  before(:each) { ActionMailer::Base.deliveries.clear }

  before(:each) do
    create_real_right_types
    create_real_groups

    FactoryBot.create(:duration_kind, code: 'nonbillable_standard')
    @clients = create_proper_chart
    @clients.update! display_label: 'Clients'
    @perplexus = Role.where(code: "perplexus").first
    @manager = create_correct_user "manager1@endpointdev.com", roles: ["perplexus", "manager"], rights: { manage_team: [{role: @perplexus.id}] }
    @user = create_correct_user "developer1@endpointdev.com", roles: ["perplexus"]
    @user_cannot_update = create_correct_user "developer2@endpointdev.com"
    @acme = FactoryBot.create :work_chart, parent: @clients, display_label: 'Acme'
    @acme_general = FactoryBot.create :work_chart, parent: @acme, display_label: 'General'
    @chart = @acme_general
    @manager_acme = create_correct_user "developer3@endpointdev.com", roles: ["perplexus"], rights: { project_manage: [ { work_chart: @acme.id } ] }
    buy_hours @chart, 11, 3.weeks.ago
    @entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @chart.id, description: "YYy", fee: 0, user: @user,
      durations: [ { kind_code: 'billable_standard', duration: 10*60 } ],
      date_performed: 10.days.ago.to_date
    @entry.fee = 100
    @entry.save!
    @audit_entries_before_update = WorkEntryAudit.where(work_entries_id: @entry.id).count
    @params = {
      id: @entry.id,
      description: "I'm a test",
      fee: 20,
      user: @user,
      durations: [ { kind_code: 'billable_standard', duration: 60, id: @entry.work_entry_durations.first.id } ],
      date_performed: 1.week.ago.to_date,
      work_chart_id: @chart.id
    }
    @params_cannot_update = {
      id: @entry.id,
      description: "I'm a test that cannot update",
      fee: 25,
      user: @user_cannot_update,
      durations: [ { kind_code: 'billable_standard', duration: 60, id: @entry.work_entry_durations.first.id } ],
      date_performed: 1.week.ago.to_date,
      work_chart_id: @chart.id
    }
  end

  it "it notifies owner if modified by manager" do
    WorkEntries::ApproveEntry.run! work_entry: @entry, user: @user
    WorkEntries::UpdateWorkEntry.run!({
        id: @entry.id,
        description: "I'm a manager test",
        fee: 20,
        user: @manager_acme,
        durations: [ { kind_code: 'billable_standard', duration: 60, id: @entry.work_entry_durations.first.id } ],
        date_performed: 1.week.ago.to_date,
        work_chart_id: @chart.id
      })
     ActionMailer::Base.deliveries.count.should == 1
  end

  it "it doesn't notify owner if modified by owner" do
     WorkEntriesMailer.expects(:notify_entry_changed).never
     WorkEntries::UpdateWorkEntry.run(@params)
     ActionMailer::Base.deliveries.count.should == 0
  end

  it "updates properly entry not having a fee yet" do
    WorkEntries::UpdateWorkEntry.run(@params).errors.full_messages.should == []
  end

  it "fails for the user who is not current owner" do
    WorkEntries::ApproveEntry.run! work_entry: @entry, user: @user
    WorkEntries::UpdateWorkEntry.run(@params).errors.full_messages.should_not == []
    @entry.reload
    WorkEntries::UpdateWorkEntry.run(@params.merge({user: @manager_acme})).errors.full_messages.should == []
    @entry.reload
    WorkEntries::DenyEntry.run! work_entry: @entry, user: @manager_acme, comment: "Your description is bad mkaaaaay"
    @entry.reload
    WorkEntries::UpdateWorkEntry.run(@params).errors.full_messages.should == []
  end

  it "updates all attributes as given" do
    update = WorkEntries::UpdateWorkEntry.run @params
    entry = update.result
    entry.reload
    entry.should_not be_nil
    entry.description.should == @params[:description]
    entry.role_id.should == @user.role_id
    entry.date_performed.should == @params[:date_performed]
    entry.work_chart_id.should == @params[:work_chart_id]
    entry.work_entry_fees.first.fee.should == @params[:fee]
    entry.work_entry_fees.count.should == 1
    entry.work_entry_durations.
      map { |d| { kind_code: d.kind_code, duration: Interval.new(d.duration) } }.
      should == @params[:durations].map { |d| { kind_code: d[:kind_code], duration: Interval.new(d[:duration]) } }
  end

  it "fails to update when a user without the proper credentials tries to update a work entry" do
    WorkEntries::UpdateWorkEntry.run(@params_cannot_update).
      errors.
      full_messages.
      should_not == ["current user cannot update"]
    update = WorkEntries::UpdateWorkEntry.run @params_cannot_update
    update.result.should be_nil
  end

  it "fails to update when there are no hours left" do
    input = {
      id: @entry.id,
      description: "I'm a test",
      fee: 20,
      user: @user,
      durations: [ { kind_code: 'billable_standard', duration: 60 * 12, id: @entry.work_entry_durations.first.id } ],
      date_performed: 1.week.ago.to_date,
      work_chart_id: @chart.id
    }
    WorkEntries::UpdateWorkEntry.run(input).
      errors.
      full_messages.
      should_not == ["current user cannot update"]
    update = WorkEntries::UpdateWorkEntry.run input
    update.result.should be_nil
  end

  it "fails to update nonbillable to billable when there are no hours left" do
    @entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @chart.id, description: "YYy", fee: 0, user: @user,
      durations: [ { kind_code: 'nonbillable_standard', duration: 15*60 } ],
      date_performed: 9.days.ago.to_date
    input = {
      id: @entry.id,
      description: "Joey",
      fee: 20,
      user: @user,
      durations: [ { kind_code: 'billable_standard', duration: 60 * 15, id: @entry.work_entry_durations.first.id } ],
      date_performed: 9.days.ago.to_date,
      work_chart_id: @chart.id
    }
    WorkEntries::UpdateWorkEntry.run(input).
      errors.
      full_messages.
      should_not == ["current user cannot update"]
    update = WorkEntries::UpdateWorkEntry.run input
    update.result.should be_nil
  end

  it 'creates audit record when updating' do
    WorkEntries::UpdateWorkEntry.run @params
    @audit_entries_after_update = WorkEntryAudit.where(work_entries_id: @entry.id).count
    @audit_entries_after_update.should ==  @audit_entries_before_update + 1
  end

end
