require 'irb'
require 'spec_helper'

describe "Teams" do
  before(:each) do
    @user = create_correct_user
    login_sucessfully
  end
  describe "GET /team/teams.json" do
    it "get a list of teams" do
      FactoryGirl.create(:role, code: "operational")

      get '/api/team/teams.json'
      response.should be_success
    end
  end
end
