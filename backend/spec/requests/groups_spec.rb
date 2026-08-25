require 'spec_helper'

describe "Groups" do
  before(:each) do
    @user = create_correct_user
    login_sucessfully
  end

  describe "GET /groups.json" do
    it "returns a JSON array of groups" do
      group = FactoryBot.create(:role, display_label: 'Group of test', code: 'group1')

      get "/api/groups.json"

      response.should be_successful
      body = JSON.parse(response.body)
      body.should be_an(Array)
      body.map { |g| g['id'] }.should include(group.id)
    end
  end

  describe "GET /groups/details.json" do
    it "returns a JSON array of groups" do
      group = FactoryBot.create(:role, display_label: 'Group of test', code: 'group1')

      get "/api/groups/details.json"

      response.should be_successful
      body = JSON.parse(response.body)
      body.should be_an(Array)
      body.map { |g| g['id'] }.should include(group.id)
    end
  end

  describe "GET /groups/groups_with_roles.json" do
    it "returns a JSON array of groups" do
      group = FactoryBot.create(:role, display_label: 'Group of test', code: 'group1')

      get "/api/groups/groups_with_roles.json"

      response.should be_successful
      body = JSON.parse(response.body)
      body.should be_an(Array)
      body.map { |g| g['id'] }.should include(group.id)
    end
  end

  describe "GET /groups/groups_no_teams.json" do
    it "returns a JSON array excluding groups that belong to a team" do
      operational = FactoryBot.create(:role, code: 'operational')
      plain  = FactoryBot.create(:role, code: 'group1', display_label: 'No team')
      teamed = FactoryBot.create(:role, code: 'group2', display_label: 'Has team')
      FactoryBot.create(:role_has_role, role_id: teamed.id, has_role_id: operational.id)

      get "/api/groups/groups_no_teams.json"

      response.should be_successful
      body = JSON.parse(response.body)
      body.should be_an(Array)
      ids = body.map { |g| g['id'] }
      ids.should include(plain.id)
      ids.should_not include(teamed.id)
    end
  end

  describe "PUT /groups.json" do
    it "updates group data" do
      role = FactoryBot.create(:role, display_label: 'Group of gnus', code: 'group3')

      group_entity = {
        isChanged: true,
        label: "New group name"
      }

      _params = {
        group_id: role.id,
        group_entity: group_entity.to_json
      }
      put "/api/groups/#{role.id}", params: _params

      labels = Role.all.map(&:display_label)
      labels.should include("New group name")
    end
  end
end
