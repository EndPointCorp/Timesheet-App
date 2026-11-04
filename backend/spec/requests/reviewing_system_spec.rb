require 'spec_helper'

describe "ReviewingSystem" do
  before :each do
    setup_basic_database_objects
    setup_basic_charts

    buy_hours @acme, 10, 2.months.ago
    buy_hours @acme_ios, 10, 2.months.ago

    @perplexus = Role.where(code: "perplexus").first
    @vogons = Role.where(code: "vogons").first

    @director = create_correct_user "director@example.com", roles: ["director"]
    @global_reviewer = create_correct_user "reviewer@example.com", roles: [], rights: [ "global_reviewer" ]

    @manager_perplexus = create_correct_user "manager1@example.com", roles: ["perplexus", "manager"], rights: { manage_team: [{ role: @perplexus.id }] }

    @developer_perplexus_acme = create_correct_user "developer1@example.com", roles: ["perplexus"], rights: { project_manage: [ { work_chart: @acme.id } ] }
    @developer_perplexus_notrep = create_correct_user "developer2@example.com", roles: ["perplexus"]
    @developer_vogons_acme_ios_devel = create_correct_user "developer3@example.com", roles: ["vogons"], rights: { project_manage: [ { work_chart: @acme_ios_devel.id } ] }
    @developer_vogons_notrep = create_correct_user "developer4@example.com", roles: ["vogons"]
  end

  describe "GET /approvals/stats" do
    it "returns proper data when no approvals found" do
      login_sucessfully @developer_perplexus_acme.email
      get approvals_stats_path, xhr: true
      data = JSON.parse(response.body)
      data['left'].should == 0
      data['last_from'].should be_nil
    end
    it "returns JSON with correct numbers and dates" do
      (1..4).to_a.map do |i|
        WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
          user: @developer_perplexus_acme,
          date_performed: i.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      end
      to_approve = WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
        user: @developer_perplexus_acme,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      WorkEntries::ApproveEntry.run!(work_entry: to_approve, user: @developer_perplexus_acme)
      WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
        user: @developer_perplexus_notrep,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
        user: @developer_perplexus_acme,
        date_performed: Date.parse('2010-09-12'),
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      login_sucessfully @developer_perplexus_acme.email
      get approvals_stats_path, xhr: true
      data = JSON.parse(response.body)
      data['left'].should == 5
      data['last_from'].should == '2010-09-12'
    end

  end

  describe "GET /approvals" do
    def result_matches_entries(response, entries)
      response.status.should be(200)
      result = JSON.parse(response.body)
      result.is_a?(Array).should be(true)
      result.count.should be(entries.count)
      i = 0
      result.each do |res|
        res.should have_key("id")
        res["id"].should eq(entries[i].id)
        res.should have_key("work_chart_id")
        res["work_chart_id"].should eq(entries[i].work_chart_id)
        res.should have_key("date_performed")
        res["date_performed"].should eq(entries[i].date_performed.to_s)
        res.should have_key("description")
        res["description"].should eq(entries[i].description)
        res.should have_key("durations")
        res["durations"].count.should eq(1)
        j = 0
        durations = entries[i].work_entry_durations
        res["durations"].each do |d|
          d.should have_key("kind_code")
          d.should have_key("duration")
          d["kind_code"].should eq("billable_standard")
          d["duration"].should eq(Interval.new(durations[j].duration).minutes)
        end
        res.should have_key("total_fees")
        res["total_fees"].should eq(entries[i].total_fees.to_s)
        res.should have_key("comments")
        i += 1
        j += 1
      end
    end
    it "returns JSON with entries that include the ones that have been created by user but not approved" do
      entries = (1..4).to_a.map do |i|
        WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
          user: @developer_perplexus_acme,
          date_performed: i.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      end
      to_approve = WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
        user: @developer_perplexus_acme,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      WorkEntries::ApproveEntry.run!(work_entry: to_approve, user: @developer_perplexus_acme)
      WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
        user: @developer_perplexus_notrep,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
        user: @developer_vogons_acme_ios_devel,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      login_sucessfully @developer_perplexus_acme.email
      get approvals_path, xhr: true
      result_matches_entries(response, entries)
    end
    it "returns the JSON for another user that the current switched to" do
      entries = (1..4).to_a.map do |i|
        WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
          user: @developer_perplexus_acme,
          date_performed: i.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      end
      managers_entries = (1..2).to_a.map do |i|
        WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_rust_devel.id,
          user: @manager_perplexus,
          date_performed: i.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      end
      login_sucessfully @manager_perplexus.email
      get approvals_path, xhr: true
      result_matches_entries(response, managers_entries)
      post assume_role_path, params: { email: @developer_perplexus_acme.email }, xhr: true
      response.status.should eq(200)
      get approvals_path, xhr: true
      result_matches_entries(response, entries)
    end
    it "returns the JSON that contains the deny comments" do
      entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
          user: @developer_perplexus_notrep,
          date_performed: 7.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      Approvals::UpdateApproval.run! work_entry: entry, user: @developer_perplexus_notrep, approved: true
      Approvals::UpdateApproval.run! work_entry: entry, user: @developer_perplexus_acme, approved: false, comment: "comment1"
      Approvals::UpdateApproval.run! work_entry: entry, user: @developer_perplexus_notrep, approved: true
      Approvals::UpdateApproval.run! work_entry: entry, user: @developer_perplexus_acme, approved: false, comment: "comment2"
      Approvals::UpdateApproval.run! work_entry: entry, user: @developer_perplexus_notrep, approved: true
      Approvals::UpdateApproval.run! work_entry: entry, user: @developer_perplexus_acme, approved: false, comment: "comment3"
      login_sucessfully @developer_perplexus_notrep.email
      get approvals_path, xhr: true
      data = JSON.parse(response.body).first
      data["comments"].count.should eq(3)
      data["comments"].map { |c| c["body"] }.sort.should eq(["comment1", "comment2", "comment3"].sort)
      data["comments"].map { |c| c["username"] }.uniq.should eq([@developer_perplexus_acme.name])
    end
  end
  describe "PATCH /approvals/:id" do
    it "returns 404 if the entry for id doesn't exist" do
      entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
        user: @developer_perplexus_acme,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      login_sucessfully @developer_perplexus_acme.email
      patch update_approval_path(entry.id + 1), params:   { approved: true  }
      response.status.should eq(404)
    end
    it "returns 400 if the entry for id doesn't belong to the current user" do
      entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
        user: @developer_perplexus_acme,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      login_sucessfully @developer_perplexus_notrep.email
      patch update_approval_path(entry.id), params:   { approved: true  }
      response.status.should eq(400)
    end
    it "returns 400 if the payload doesn't have the approved boolean" do
      entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
        user: @developer_perplexus_acme,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      login_sucessfully @developer_perplexus_acme.email
      patch update_approval_path(entry.id)
      response.status.should eq(400)
    end
    it "returns 400 if the payload's approved key isn't boolean" do
      entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
        user: @developer_perplexus_acme,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      login_sucessfully @developer_perplexus_acme.email
      patch update_approval_path(entry.id), params:   { approved: 12  }
      response.status.should eq(400)
    end
    it "returns 400 if the entry for id doesn't belong to the currently switched to user" do
      entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
        user: @developer_perplexus_acme,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      login_sucessfully @manager_perplexus.email
      post assume_role_path, params: { email: @developer_perplexus_notrep.email }, xhr: true
      response.status.should eq(200)
      patch update_approval_path(entry.id), params:   { approved: true  }
      response.status.should eq(400)
    end
    it "returns 400 if the entry for id is being denied by an author" do
      entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
        user: @developer_perplexus_acme,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      login_sucessfully @developer_perplexus_acme.email
      patch update_approval_path(entry.id), params:   { approved: false, comment: "comment1"  }
      response.status.should eq(400)
    end
    it "returns 200 if the unaproved entry for id has been approved sucessfully" do
      entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
        user: @developer_perplexus_acme,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      login_sucessfully @developer_perplexus_acme.email
      patch update_approval_path(entry.id), params:   { approved: true  }
      response.status.should eq(200)
      Approval.where(work_entry_id: entry.id, role_id: @developer_perplexus_acme.role_id, approved: nil).count.should be(0)
    end
    it "returns 200 if the unaproved entry for id has been approved sucessfully for a switched to user" do
      entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
        user: @developer_perplexus_acme,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      login_sucessfully @manager_perplexus.email
      post assume_role_path, params: { email: @developer_perplexus_acme.email }, xhr: true
      response.status.should eq(200)
      patch update_approval_path(entry.id), params:   { approved: true  }
      response.status.should eq(200)
      Approval.where(work_entry_id: entry.id, role_id: @developer_perplexus_acme.role_id, approved: nil).count.should be(0)
    end
    it "results in current approval belonging to a project manager after successfully approving by an author" do
      entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
        user: @developer_perplexus_notrep,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      login_sucessfully @developer_perplexus_notrep.email
      patch update_approval_path(entry.id), params:   { approved: true  }
      response.status.should eq(200)
      Approval.where(work_entry_id: entry.id, approved: nil).where('? = any(owner_ids)', @developer_perplexus_notrep.role_id).count.should be(0)
      Approval.where(work_entry_id: entry.id, approved: nil).where('? = any(owner_ids)', @developer_perplexus_acme.role_id).count.should be(1)
      entry.reload
      Approval.where(work_entry_id: entry.id, approved: nil).where('? = any(owner_ids)', @manager_perplexus.role_id).count.should be(0)
    end

    it "results in current approval belonging to an author after successfully denying by project manager" do
      entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
        user: @developer_perplexus_notrep,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      Approvals::UpdateApproval.run! work_entry: entry, user: @developer_perplexus_notrep, approved: :true
      entry.reload
      login_sucessfully @developer_perplexus_acme.email
      patch update_approval_path(entry.id), params:   { approved: false, comment: "comment"  }
      response.status.should eq(200)
      Approval.where(work_entry_id: entry.id, approved: nil).where('? = any(owner_ids)', @developer_perplexus_acme.role_id).count.should be(0)
      entry.reload
      Approval.where(work_entry_id: entry.id, approved: nil).where('? = any(owner_ids)', @developer_perplexus_notrep.role_id).count.should be(1)
    end

    it "results in current approval belonging to noone after successfully accepting by a global reviewer if pm doesn't exist" do
      @other = FactoryBot.create :work_chart, parent: @clients, display_label: 'other'
      @other_general = FactoryBot.create :work_chart, parent: @other, display_label: 'General'
      @director2 = create_correct_user "director2@example.com", roles: ["director", "perplexus"]
      entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @other_general.id,
        user: @global_reviewer,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      Approvals::UpdateApproval.run! work_entry: entry, user: @global_reviewer, approved: :true
      entry.reload
      Approval.where(work_entry_id: entry.id, approved: nil).count.should == 0
    end

    it "results in approval on the global list after successfully approving by author if author is PM" do
      entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_general.id,
        user: @developer_perplexus_acme,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      Approvals::UpdateApproval.run! work_entry: entry, user: @developer_perplexus_acme, approved: :true
      a = Approval.where(work_entry_id: entry.id, approved: nil)
      a.count.should be(1)
      a.first.reviewers.first.email.should eq("reviewer@example.com")
    end

    it "results in no approval left after successfully approving by the project manager" do
      entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_general.id,
        user: @developer_perplexus_notrep,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      Approvals::UpdateApproval.run! work_entry: entry, user: @developer_perplexus_notrep, approved: :true
      action = Approvals::UpdateApproval.run work_entry: entry, user: @developer_perplexus_acme, approved: :true
      binding.irb unless action.errors.empty?
      Approval.where(work_entry_id: entry.id, approved: nil).count.should be(0)
    end
    
    it "results in a team manager approval after successfully approving by a regular user when a project manager is not set" do
      entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @administration_project.id,
        user: @developer_perplexus_notrep,
        date_performed: 0.days.ago.to_date,
        fee: 0,
        description: "test",
        durations: [{ kind_code: "billable_standard", duration: (0.25 * 60) }]
      Approvals::UpdateApproval.run! work_entry: entry, user: @developer_perplexus_notrep, approved: :true
      a = Approval.where(work_entry_id: entry.id, approved: nil)
      a.count.should be(1)
      a.first.reviewers.first.email.should eq("manager1@example.com")
    end
  end
end
