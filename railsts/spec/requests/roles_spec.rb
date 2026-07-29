require 'spec_helper'

describe "Roles" do
  before(:each) do
    @user = create_correct_user
    login_sucessfully
  end


  describe "GET /roles.json" do
    it "returns a JSON array of roles" do
      role = FactoryBot.create(:role, display_label: 'Group of test', code: 'group1')

      get "/api/roles.json"

      response.should be_successful
      body = JSON.parse(response.body)
      body.should be_an(Array)
      body.map { |r| r['id'] }.should include(role.id)
    end
  end
end