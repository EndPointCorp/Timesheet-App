require 'benchmark'
require 'spec_helper'
require 'irb'

describe "HoursInTheBank" do

  before(:each) do
    Delayed::Worker.delay_jobs = false
    setup_basic_database_objects
    setup_basic_charts

    buy_hours @acme, 10, 2.months.ago
    buy_hours @acme_ios, 10, 2.months.ago

    @perplexus = Role.where(code: "perplexus").first
    @vogons = Role.where(code: "vogons").first

    @director = create_correct_user "director@endpointdev.com", roles: ["director"]

    @manager_perplexus = create_correct_user "manager1@endpointdev.com", roles: ["perplexus", "manager"], rights: { manage_team: [{ role: @perplexus.id }] }

    @developer_perplexus_acme = create_correct_user "developer1@endpointdev.com", roles: ["perplexus"], rights: { project_manage: [ { work_chart: @acme.id } ] }
    @developer_perplexus_notrep = create_correct_user "developer2@endpointdev.com", roles: ["perplexus"]
    @developer_vogons_acme_ios_devel = create_correct_user "developer3@endpointdev.com", roles: ["vogons"], rights: { project_manage: [ { work_chart: @acme_ios_devel.id } ] }
    @developer_vogons_notrep = create_correct_user "developer4@endpointdev.com", roles: ["vogons"]
  end

  after(:each) do
    Delayed::Worker.delay_jobs = true
  end

  describe "GET /hours/summary" do
    before :each do
      @foo = FactoryBot.create :work_chart, parent: @clients, display_label: 'Foo'
      @foo_general = FactoryBot.create :work_chart, parent: @foo, display_label: 'General'
      @foo_ios = FactoryBot.create :work_chart, parent: @foo, display_label: 'iOS'
      @foo_ios_devel = FactoryBot.create :work_chart, parent: @foo_ios, display_label: 'Devel'
      @foo_ios_design = FactoryBot.create :work_chart, parent: @foo_ios, display_label: 'Design'
      @foo_rust = FactoryBot.create :work_chart, parent: @foo, display_label: 'Rust'
      @foo_rust_devel = FactoryBot.create :work_chart, parent: @foo_rust, display_label: 'Devel'
      @bar = FactoryBot.create :work_chart, parent: @clients, display_label: 'Bar'
      @bar_general = FactoryBot.create :work_chart, parent: @bar, display_label: 'General'
      @bar_ios = FactoryBot.create :work_chart, parent: @bar, display_label: 'iOS'
      @bar_ios_devel = FactoryBot.create :work_chart, parent: @bar_ios, display_label: 'Devel'
      @bar_ios_design = FactoryBot.create :work_chart, parent: @bar_ios, display_label: 'Design'
      @bar_rust = FactoryBot.create :work_chart, parent: @bar, display_label: 'Rust'
      @bar_rust_devel = FactoryBot.create :work_chart, parent: @bar_rust, display_label: 'Devel'

      buy_hours @bar_ios, 100, 2.months.ago
      buy_hours @foo, 100, 2.months.ago
    end

    describe "for all users" do
      it "lists all projects they worked for" do
        WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
          user: @developer_perplexus_acme,
          date_performed: 0.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: (7.25 * 60) }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_general.id,
          user: @developer_perplexus_acme,
          date_performed: 0.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: (7.25 * 60) }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @foo_ios_devel.id,
          user: @developer_perplexus_acme,
          date_performed: 29.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: (7.25 * 60) }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @bar_ios_devel.id,
          user: @developer_perplexus_acme,
          date_performed: 31.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: (7.25 * 60) }]
        login_sucessfully @developer_perplexus_acme.email
        get hours_summary_path
        response.status.should eq(200)
        data = JSON.parse(response.body)
        data.map { |i| i["budget_chart_id"] }.uniq.sort.should eq([@acme.id, @acme_ios.id, @foo.id, @bar_ios.id].sort)
      end
      it "lists nested nodes correctly on the list" do
        WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
          user: @developer_perplexus_acme,
          date_performed: 0.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: (7.25 * 60) }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @foo_ios_devel.id,
          user: @developer_perplexus_acme,
          date_performed: 29.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: (7.25 * 60) }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @bar_ios_devel.id,
          user: @developer_perplexus_acme,
          date_performed: 31.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: (7.25 * 60) }]
        login_sucessfully @developer_perplexus_acme.email
        get hours_summary_path
        response.status.should eq(200)
        data = JSON.parse(response.body)
        data.map { |i| i["budget_chart_id"] }.uniq.sort.should eq([@acme_ios.id, @foo.id, @acme.id, @bar_ios.id].sort)
      end
      it "includes all needed fields for each work chart" do
        WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_devel.id,
          user: @developer_perplexus_acme,
          date_performed: 0.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: (7.25 * 60) }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @bar_ios_devel.id,
          user: @developer_perplexus_acme,
          date_performed: 29.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: (2 * 7.25 * 60) }]
        login_sucessfully @developer_perplexus_acme.email
        get hours_summary_path
        response.status.should eq(200)
        data = JSON.parse(response.body)
        sorted = [ @acme.id, @acme_ios.id, @bar_ios.id].sort
        data.sort_by { |d| d["budget_chart_id"] }.each_with_index do |datum, i|
          datum.should have_key("budget_chart_id")
          datum["budget_chart_id"].should eq(sorted[i])
          datum.should have_key("minutes_left")
          datum.should have_key("budget_chart_labels")
          datum["budget_chart_labels"].should eq(ChartLabel.find(datum["budget_chart_id"]).labels)
        end
      end

      it "shows proper values after creation of transactions for the times before the hours in the bank feature" do
        WorkCharts::AssignProjectManager.run! user: @developer_perplexus_notrep,
          work_chart: @foo
        WorkEntries::CreateWorkEntry.run! work_chart_id: @foo_ios_devel.id,
          user: @developer_perplexus_notrep,
          date_performed: 9.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 10*60 }]
        buy_hours @foo_ios, 200, 1.year.ago
        login_sucessfully @developer_perplexus_notrep.email
        get hours_summary_path
        response.status.should eq(200)
        data = JSON.parse(response.body)
        data.map { |i| i["budget_chart_id"] }.sort.should include(@foo_ios.id)
        ios = data.find { |i| i["budget_chart_id"] == @foo_ios.id }
        ios["minutes_left"].should eq(190*60)
      end

      it "updates the totals properly upon updating of a work entry" do
        entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @foo_ios_devel.id,
          user: @developer_perplexus_notrep,
          date_performed: 10.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 10*60 }]
        duration = entry.work_entry_durations.first
        duration.duration = 20*60
        duration.save!
        sleep 1
        login_sucessfully @developer_perplexus_notrep.email
        get hours_summary_path
        response.status.should eq(200)
        data = JSON.parse(response.body)
        data.count.should == 1
        data.first["minutes_left"].should == 80*60
      end

      it "updates the totals properly upon updating of a work entry" do
        WorkEntries::CreateWorkEntry.run! work_chart_id: @foo_ios_devel.id,
          user: @developer_perplexus_notrep,
          date_performed: 10.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 10*60 }]
        transaction = Transaction.where(work_chart_id: @foo.id).first
        Transactions::UpdateTransaction.run! id: transaction.id, hours: 50, description: "", kind: "regular", date: transaction.date
        sleep 1
        login_sucessfully @developer_perplexus_notrep.email
        get hours_summary_path
        response.status.should eq(200)
        data = JSON.parse(response.body)
        data.count.should == 1
        data.first["minutes_left"].should == 40*60
      end

      it "updates the totals properly upon deletion of a work entry" do
        entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @foo_ios_devel.id,
          user: @developer_perplexus_notrep,
          date_performed: 10.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 10*60 }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @foo_ios_devel.id,
          user: @developer_perplexus_notrep,
          date_performed: 9.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 10*60 }]
        WorkEntries::DestroyWorkEntry.run! work_entry_id: entry.id, user: @developer_perplexus_notrep
        login_sucessfully @developer_perplexus_notrep.email
        get hours_summary_path
        response.status.should eq(200)
        data = JSON.parse(response.body)
        data.count.should == 1
        data.first["minutes_left"].should == 90*60
      end
    end

    describe "for project managers" do
      it 'lists all charts with low hours they worked for lately as well as all the ones they are reps for' do
        WorkCharts::AssignProjectManager.run! user: @developer_vogons_notrep,
          work_chart: @bar_ios
        WorkEntries::CreateWorkEntry.run! work_chart_id: @foo_ios_design.id,
          user: @developer_vogons_notrep,
          date_performed: 13.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 7*60 }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @bar_ios_devel.id,
          user: @developer_perplexus_acme,
          date_performed: 13.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 27*60 }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_general.id,
          user: @developer_perplexus_acme,
          date_performed: 13.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 7*60 }]
        login_sucessfully @developer_vogons_notrep.email
        get hours_summary_path
        response.status.should eq(200)
        data = JSON.parse(response.body)
        data.count.should eq(2)
        data.map { |d| d["budget_chart_id"] }.uniq.sort.should eq([@bar_ios.id, @foo.id].sort)
        foo_stats = data.select { |d| d["budget_chart_id"] == @foo.id }.first
        bar_stats = data.select { |d| d["budget_chart_id"] == @bar_ios.id }.first
        foo_stats.should_not be_nil
        bar_stats.should_not be_nil
        foo_stats["minutes_left"].should eq((100-7)*60)
        bar_stats["minutes_left"].should eq((100-27)*60)
      end
    end

    describe "for managers" do
      it "lists all charts with low hours for everyone from their team" do
        buy_hours @acme, 100, 1.week.ago
        WorkEntries::CreateWorkEntry.run! work_chart_id: @foo_ios_devel.id,
          user: @developer_perplexus_acme,
          date_performed: 10.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 10*60 }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @foo_general.id,
          user: @developer_perplexus_acme,
          date_performed: 10.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 10*60 }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @foo_rust_devel.id,
          user: @developer_perplexus_notrep,
          date_performed: 12.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 10*60 }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @foo_ios_design.id,
          user: @developer_perplexus_notrep,
          date_performed: 13.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 54*60 }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_design.id,
          user: @developer_perplexus_notrep,
          date_performed: 13.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 5*60 }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_general.id,
          user: @developer_perplexus_acme,
          date_performed: 13.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 5*60 }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @bar_ios_devel.id,
          user: @manager_perplexus,
          date_performed: 2.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 10*60 }]
        login_sucessfully @manager_perplexus.email
        sleep 1
        get hours_summary_path
        response.status.should eq(200)
        data = JSON.parse(response.body)
        bar_ios_stats = data.select { |d| d["budget_chart_id"] == @bar_ios.id }.first
        acme_ios_stats = data.select { |d| d["budget_chart_id"] == @acme_ios.id }.first
        foo_stats = data.select { |d| d["budget_chart_id"] == @foo.id }.first
        bar_ios_stats.should_not be_nil
        acme_ios_stats.should_not be_nil
        foo_stats.should_not be_nil
        bar_ios_stats["minutes_left"].should eq(90*60)
        acme_ios_stats["minutes_left"].should eq(5*60)
        foo_stats["minutes_left"].should eq(16*60)
      end
    end

    describe "directors" do
      it "lists all charts with low hours for everyone in the company" do
        WorkEntries::CreateWorkEntry.run! work_chart_id: @foo_ios_devel.id,
          user: @developer_perplexus_acme,
          date_performed: 10.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 68*60 }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @bar_ios_devel.id,
          user: @developer_perplexus_notrep,
          date_performed: 10.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 88*60 }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_rust_devel.id,
          user: @developer_vogons_acme_ios_devel,
          date_performed: 12.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 1*60 }]
        WorkEntries::CreateWorkEntry.run! work_chart_id: @acme_ios_design.id,
          user: @developer_vogons_notrep,
          date_performed: 13.days.ago.to_date,
          fee: 0,
          description: "test",
          durations: [{ kind_code: "billable_standard", duration: 1*60 }]
        login_sucessfully @director.email
        get hours_summary_path
        response.status.should eq(200)
        data = JSON.parse(response.body)
        data.count.should eq(3)
        bar_ios_stats = data.select { |d| d["budget_chart_id"] == @bar_ios.id }.first
        acme_stats = data.select { |d| d["budget_chart_id"] == @acme.id }.first
        acme_ios_stats = data.select { |d| d["budget_chart_id"] == @acme_ios.id }.first
        bar_ios_stats.should_not be_nil
        acme_stats.should_not be_nil
        acme_ios_stats.should_not be_nil
        bar_ios_stats["minutes_left"].should eq(12*60)
        acme_stats["minutes_left"].should eq(9*60)
        acme_ios_stats["minutes_left"].should eq(9*60)
      end
    end
  end

  describe "GET /hours/:work_chart_id" do
    before(:each) do
      @foo = FactoryBot.create :work_chart, parent: @clients, display_label: 'Foo'
      @foo_rust = FactoryBot.create :work_chart, parent: @foo, display_label: 'Rust'
      @foo_rust_devel = FactoryBot.create :work_chart, parent: @foo_rust, display_label: 'Devel'
    end

    it "returns the correct number for the chart with a budget" do
      login_sucessfully @developer_perplexus_acme.email
      get show_hours_path(@acme_rust_devel.id)
      response.status.should == 200 
      data = JSON.parse(response.body)
      data.first["budget_chart_id"].should == @acme.id
      data.first["minutes_left"].should == 10*60
      data.first["budget_chart_labels"].should eq(ChartLabel.find(@acme.id).labels)
    end

    it "returns null for the chart without the budget" do
      login_sucessfully @developer_perplexus_acme.email
      get show_hours_path(@foo_rust_devel.id)
      response.status.should == 200 
      data = JSON.parse(response.body)
      data.should_not be_present
    end
  end

end
