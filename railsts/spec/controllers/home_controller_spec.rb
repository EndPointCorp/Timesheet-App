require 'spec_helper'

describe HomeController do

  describe "GET 'index'" do
    before(:each) do
      FactoryGirl.create :work_chart
    end
    it "returns http success" do
      get 'index'
      response.should be_success
    end
  end

end
