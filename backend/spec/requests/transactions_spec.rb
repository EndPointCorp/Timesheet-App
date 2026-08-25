require 'spec_helper'

describe "Transactions" do
  before(:each) do
    @user = create_correct_user
    login_sucessfully
  end

  describe "GET transactions.json" do
    it "get a list of transactions" do
      work_chart = FactoryBot.create(:work_chart)

      get '/api/transactions.json?work_chart_id=' + work_chart.id.to_s

      response.should be_successful
    end
  end

  describe "GET transactions.json" do
    it "get a list of transactions without login" do
      work_chart = FactoryBot.create(:work_chart)

      logout_sucessfully

      get '/api/transactions.json?work_chart_id=' + work_chart.id.to_s

      response.should_not be_successful
    end
  end
end
