require "spec_helper"

describe UserReport do
  before(:each) do 
    @root = FactoryGirl.create :work_chart, id: 1, display_label: 'Top node'
    @endpoint = FactoryGirl.create :work_chart, id: 2, display_label: 'End Point', parent_id: @root.id
    @client = FactoryGirl.create :work_chart, id: 3, display_label: 'Clients', parent_id: @endpoint.id
    @user = FactoryGirl.create(:user, name: 'User1')
    @client1 = FactoryGirl.create :work_chart, display_label: 'Client One', parent_id: @client.id   
  end
  describe "nag emails delivery with entries" do
    before(:each) do 
      @entry = FactoryGirl.create(:work_entry, role_id: @user.role_id, work_chart_id: @client1.id, date_performed: '2014/12/23')
      options = {}
      options[:begin_date] = Time.zone.parse('2014-12-23')
      options[:end_date] = Time.zone.parse('2014-12-23')
      @result = UserReport.send_report(@user.email, options)
    end

    it "verifies the from address" do
      ActionMailer::Base.deliveries.last.from.should == [MAILER_FROM_EMAIL]
    end

    it "verifies the to address" do
      ActionMailer::Base.deliveries.last.to.should == [@user.email]
    end

    it "verifies the bcc address" do
      ActionMailer::Base.deliveries.last.bcc.should == \
        MAILER_USER_REPORT_FILLED_BCC_RECIPIENTS.split(',')
    end

    it "verifies the subject" do
      @first_name = @user[:name].try(:split, /\s/).try(:first)
      ActionMailer::Base.deliveries.last.subject.should include("#{@first_name}, thanks for promptly submitting your time sheet! (1.00)")
    end

    it "send report with multiple durations for a entry" do
      ActionMailer::Base.deliveries.last.to.should == [@entry.owner.email] 
    end
  end
  describe "nag emails delivery without entries" do
    before(:each) do 
      options = {}
      options[:begin_date] = Time.zone.parse('2014-12-23')
      options[:end_date] = Time.zone.parse('2014-12-23')
      @result = UserReport.send_report(@user.email, options)
    end

    it "verifies the from address" do
      ActionMailer::Base.deliveries.last.from.should == [MAILER_FROM_EMAIL]
    end

    it "verifies the to address" do
      ActionMailer::Base.deliveries.last.to.should == [@user.email] 
    end

    it "verifies the bcc address" do
      ActionMailer::Base.deliveries.last.bcc.should == \
        MAILER_USER_REPORT_EMPTY_BCC_RECIPIENTS.split(',')
    end

    it "verifies the subject" do
      @first_name = @user[:name].try(:split, /\s/).try(:first)
      ActionMailer::Base.deliveries.last.subject.should include("#{@first_name}, did you forget to fill out your time sheet yesterday?")
    end

  end

  describe "nag emails delivery with entries have multiple durations" do
    before(:each) do 
      @entry = FactoryGirl.create(:work_entry, role_id: @user.role_id, work_chart_id: @client1.id, date_performed: '2014/12/23', has_many_durations: true)
      options = {}
      options[:begin_date] = Time.zone.parse('2014-12-23')
      options[:end_date] = Time.zone.parse('2014-12-23')
      @result = UserReport.send_report(@user.email, options)
    end

    it "verifies the subject" do
      @first_name = @user[:name].try(:split, /\s/).try(:first)
      ActionMailer::Base.deliveries.last.subject.should include("#{@first_name}, thanks for promptly submitting your time sheet! (2.00)")
    end

    it "verifies the logged hours in body" do
      ActionMailer::Base.deliveries.last.body.should include("Total time logged for time period: 2.00 hours")
    end

    it "verifies the work entry with multiple durations in body" do
      ActionMailer::Base.deliveries.last.body.should include("Clients - Client One")
      ActionMailer::Base.deliveries.last.body.should include("Billable Standard: 1h 0m")
      ActionMailer::Base.deliveries.last.body.should include("Non-billable Standard: 1h 0m")
      ActionMailer::Base.deliveries.last.body.should include("Lorem ipsum dolor sit amet")
    end
  end

  describe "nag emails to manager" do
    before(:each) do 
      @entry = FactoryGirl.create(:work_entry, role_id: @user.role_id, work_chart_id: @client1.id, date_performed: '2014/12/23')
      options = {}
      options[:begin_date] = Time.zone.parse('2014-12-23')
      options[:end_date] = Time.zone.parse('2014-12-23')

      # Build Team Roles
      @base_team = FactoryGirl.create(:role, id: 82, code: "team", display_label: "Base role for teams")
      @operational_team = FactoryGirl.create(:role, id: 7, code: "operational", display_label: "Operational team grouping")
      FactoryGirl.create(:role_has_role, role_id: @operational_team.id, has_role_id: @base_team.id)
      @teama = FactoryGirl.create(:role, id: 26, code: "team_a", display_label: "TeamA")
      FactoryGirl.create(:role_has_role, role_id: @teama.id, has_role_id: @operational_team.id)

      # Tag Users to Team
      @user2 = FactoryGirl.create(:user, name: 'User2')
      FactoryGirl.create(:role_has_role, role_id: @user2.role_id, has_role_id: @teama.id)
      FactoryGirl.create(:role_has_role, role_id: @user.role_id, has_role_id: @teama.id)
      @set_manager = FactoryGirl.create(:role, id: 81, code: "manager", display_label: "Base management role")
      @set_staff = FactoryGirl.create(:role, id: 10, code: "staff", display_label: "General grouping for staff")
      FactoryGirl.create(:role_has_role, role_id: @set_manager.id, has_role_id: @set_staff.id)

      # Set Manager rights to User
      @manage_right_type = FactoryGirl.create(:right_type, id: 5, code: "manage_team", display_label: "Manage other roles")
      @set_right = FactoryGirl.create(:right, role_id: @user2.role_id, right_type_id: @manage_right_type.id)
      @set_target = FactoryGirl.create(:right_target, right_id: @set_right.id, ref_obj_pk: @teama.id)

      @result = UserReport.send_report(@user.email, options)
    end

    it "verifies the manager address" do
      ActionMailer::Base.deliveries.last.cc.should == [@user2.email] 
    end
  end

end
