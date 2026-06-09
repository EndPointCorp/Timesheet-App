require 'spec_helper'

describe WorkEntry do

  before(:each) do

  end

  it 'has a valid factory' do
    FactoryBot.create(:work_entry).should be_valid
  end
  
  describe '#work_chart_label_parts' do
    it 'returns array consisting of every label of work chart and its parents except for root and child of root' do
      @root = FactoryBot.create :work_chart, id: 1, display_label: 'Top node'
      @endpoint = FactoryBot.create :work_chart, id: 2, display_label: 'End Point', parent_id: @root.id
      @clients_node = FactoryBot.create :work_chart, id: 3, display_label: 'Clients', parent_id: @endpoint.id
      @clients = FactoryBot.create_list :work_chart, 5, parent_id: @clients_node.id
      @generals = @clients.map { |chart| FactoryBot.create :work_chart, parent_id: chart.id }
      @entries = @generals.map { |chart| FactoryBot.create :work_entry, work_chart_id: chart.id }
      @entries.each do |entry|
        labels = entry.work_chart_label_parts
        labels.count.should == 4
        labels.second.should == 'Clients'
        labels.last.should == entry.work_chart.display_label
      end
    end
  end

  describe 'update_work_entries' do
   # TODO: simplify this use case for the new hanbdling of teams
   # it 'only allows work entries to be editted by those with the correct credentials' do
   #   #workcharts
   #   @work_chart = create_proper_chart
   #   @child_chart = FactoryBot.create(:work_chart, parent_id: @work_chart.id, display_label: "Child Chart")
   #   #users
   #   @current_owner = FactoryBot.create(:user)
   #   @user_who_cannot_edit = FactoryBot.create(:user)
   #   @team_manager = FactoryBot.create(:user, email: "team_manager@endpointdev.com")
   #   @client_rep = FactoryBot.create(:user, email: 'client_rep@endpointdev.com')
   #   @recipient = FactoryBot.create(:user, id: 24)
   #   #roles
   #   @operational_role = FactoryBot.create(:role, code: "operational") 
   #   @manager_role = FactoryBot.create(:role, code: "manager")
   #   @team_role = FactoryBot.create(:role, code: "perplexus", display_label: "Perplexus")
   #   #rights, right types & targets
   #   @manager_right_type_target_kind = FactoryBot.create(:right_type_target_kind, code: 'role', display_label: "role", model_class: "Role", relation_name: "role")
   #   @manager_right_type = FactoryBot.create(:right_type, code: "manage_team", display_label: "Manage other roles", target_kind_code: "role")
   #   @manager_right = FactoryBot.create(:right, role_id: @team_manager.role_id, right_type_id: @manager_right_type.id)
   #   @right_type_target_kind = FactoryBot.create(:right_type_target_kind, code: 'work_chart', display_label: "Work Chart", model_class: "WorkChart", relation_name: "work_chart")
   #   @right_type = FactoryBot.create(:right_type, code: "represent", target_kind_code: "work_chart", display_label: "Represent")
   #   @right = FactoryBot.create(:right, role_id: @client_rep.role_id, right_type_id: @right_type.id)
   #   @right_target = FactoryBot.create(:right_target, right_id: @right.id, ref_obj_pk: @work_chart.id)
   #   @manager_right_target = FactoryBot.create(:right_target, right_id: @manager_right.id, ref_obj_pk: @team_role.id)
   #   #team, team member & team manager assignment
   #   @team = Team.new(@team_role)
   #   @team_member_1 = FactoryBot.create(:role_has_role, role_id: @team_role.id, has_role_id:  @current_owner.role.id)
   #   @manager_team_member = FactoryBot.create(:role_has_role, role_id: @team_manager.role_id, has_role_id: @manager_role.id)
   #   @client_rep_team_member = FactoryBot.create(:role_has_role, role_id: @client_rep.role.id, :has_role_id=> @operational_role.id)
   #   @manager_role_has_role =  FactoryBot.create(:role_has_role, role_id: @team_manager.role_id, has_role_id: @team.role.id)
   #   @client_rep_role_has_role = FactoryBot.create(:role_has_role, role_id: @client_rep.role.id, has_role_id: @team.role.id)
   #   @team_role_has_role = FactoryBot.create(:role_has_role, role_id: @team_role.id, has_role_id: @operational_role.id)
   #   #client rep assignment
   #   @client_rep.make_rep_for(@child_chart)
   #   #work entry & review
   #   @entry = WorkEntries::CreateWorkEntry.run! work_chart_id: @child_chart.id, description: "YYy", fee: 0, user: @client_rep,
   #     durations: [ { kind_code: 'billable_standard', duration: 10*60 } ],
   #     date_performed: 10.days.ago.to_date
   #   ###Test Results###
   #   @entry.work_chart.client_rep.should eq(@client_rep)
   #   @team_manager.is_manager_for?(@client_rep).should be_truthy

   #   @entry.is_editable_by?(@user_who_cannot_edit).should be_falsey
   #   @entry.is_editable_by?(@client_rep).should be_truthy
   # end
  end

end
