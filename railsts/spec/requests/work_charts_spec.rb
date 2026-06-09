require 'spec_helper'

describe "WorkCharts" do 

  before(:each) do
    @user = create_correct_user
    login_sucessfully
    grant_superuser
    grant_manage_workcharts
  end
 
  describe "work_charts/search***" do
    
    before(:each) do
      @root = FactoryBot.create :work_chart, id: 1, display_label: 'Top node'
      @endpoint = FactoryBot.create :work_chart, id: 2, display_label: 'End Point', parent_id: @root.id
      @client = FactoryBot.create :work_chart, id: 3, display_label: 'Clients', parent_id: @endpoint.id
      @pto = FactoryBot.create :work_chart, display_label: 'Paid Time Off', parent_id: @endpoint.id
      @pto_active = FactoryBot.create :work_chart, status: 'active', parent_id: @pto.id
      @pto_hidden = FactoryBot.create :work_chart, status: 'hidden', parent_id: @pto.id
      @pto_dead = FactoryBot.create :work_chart, status: 'dead', parent_id: @pto.id
    end

    # TODO: refactor search actions and provide test cases mocking the search server

  end

  describe "GET /workcharts/quicks" do
    it "fetches most frequent & recent work charts used in last 3 months" do
      get '/api/work_charts/quicks.json'
      response.status.should == 200
    end
  end

  describe "GET /work_charts/show" do
    it "fetches a work_chart" do
      work_chart = FactoryBot.create(:work_chart)
      get "/api/work_charts/#{work_chart.id}.json"
      response.should be_successful
      assigns(:chart).should eq(work_chart)
    end
  end

  describe "GET /work_charts/:id/find_heirs" do
    it "fetches a work_chart" do
      parent_chart = FactoryBot.create(:work_chart)
      child_chart  = FactoryBot.create(:work_chart, parent_id: parent_chart.id)
      get "/api/work_charts/#{parent_chart.id}/find_heirs"
      response.status.should == 200
      response.body.should eq "[\"#{child_chart.display_label}\"]"
    end
  end

  describe "GET /work_charts.json" do
    it "gets list of work_charts" do
      get '/api/work_charts.json'
      response.should be_successful
    end
  end

  describe "POST /work_charts.json" do
    it "saves new work_chart in database" do
      FactoryBot.create :work_chart_status, status: 'active'
      parent = FactoryBot.create :work_chart
      _params = { display_label: 'NewClient', status: "active", parent_id: parent.id }
      post '/api/work_charts.json', params: {  work_chart: _params }
      response.status.should == 200
      WorkChart.count.should == 2
      WorkChart.all.map(&:display_label).should include('NewClient')
    end
  end
  
  describe "PUT /work_charts.json" do
    it "updates work_chart in database" do
      FactoryBot.create :work_chart_status, status: 'active'
      parent = FactoryBot.create :work_chart
      work_chart = FactoryBot.create :work_chart, parent_id: parent.id
      _params = { display_label: 'UpdatedClient', parent_id: parent.id, status: 'active' }
      put "/api/work_charts/#{work_chart.id}.json", params: {  work_chart: _params }
      response.status.should == 200
      WorkChart.count.should == 2
      WorkChart.all.map(&:display_label).should include('UpdatedClient')
    end
  end
end
