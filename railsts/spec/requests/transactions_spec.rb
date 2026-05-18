require 'spec_helper'

describe "Transactions" do
  before(:each) do
    @user = create_correct_user
    login_sucessfully
  end

  describe "GET transactions.json" do
    it "get a list of transactions" do
      work_chart = FactoryGirl.create(:work_chart)

      get '/transactions.json?work_chart_id=' + work_chart.id.to_s

      response.should be_success
    end
  end

  describe "GET transactions.json" do
    it "get a list of transactions without login" do
      work_chart = FactoryGirl.create(:work_chart)

      logout_sucessfully

      get '/transactions.json?work_chart_id=' + work_chart.id.to_s

      response.should_not be_success
    end
  end
end
