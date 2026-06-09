require 'spec_helper'

describe "Groups" do
  before(:each) do
    @user = create_correct_user
    login_sucessfully
  end

  describe "GET /groups.json" do
    it "gets a list of groups" do
      FactoryBot.create(:role, display_label: 'Group of test', code: 'group1')
      roles = Role.select("id, code, code AS value, display_label as label").where('code NOT LIKE ?', '%user%')
      get "/api/groups.json"

      response.should be_successful
      assigns(:groups_list).map(&:id).should eq(roles.map(&:id))
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
