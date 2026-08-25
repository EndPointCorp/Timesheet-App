require 'spec_helper'

describe "WorkEntry" do 

  before(:each) do
    @user = create_correct_user
    login_sucessfully
    grant_superuser
  end
  describe "POST work_entries" do
    before(:each) do
      @root = FactoryBot.create :work_chart, id: 1, display_label: 'Top node'
      @endpoint = FactoryBot.create :work_chart, id: 2, display_label: 'End Point', parent_id: @root.id
      @client = FactoryBot.create :work_chart, id: 3, display_label: 'Clients', parent_id: @endpoint.id
      @pto = FactoryBot.create :work_chart, id: 4, display_label: 'Paid Time Off', parent_id: @endpoint.id
    end
    it "validates mac line endings converted to UNIX in work entry" do
      FactoryBot.create(:work_entry)
      FactoryBot.create :duration_kind, code: 'nonbillable_pto', production_category_id: ProductionCategory.last.id, abbr_label: 'NBTO'
      _params = { work_chart_id: 4, description: "Hello\rHello", date_performed: "2014/03/20",
        work_entry_durations_attributes: { '0' => {kind_code: 'nonbillable_pto', duration: 0}}, 
        work_entry_fees_attributes: { '0' => {fee: 0}} }
      post '/api/work_entries.json', params: {  work_entry: _params }
      response.status.should == 200
      result = JSON.parse(response.body)
      result['description'].should_not include("\r")
    end
    it "validates windows line endings converted to UNIX in work entry" do
      FactoryBot.create(:work_entry)
      FactoryBot.create :duration_kind, code: 'nonbillable_pto', production_category_id: ProductionCategory.last.id, abbr_label: 'NBTO'
      _params = { work_chart_id: 4, description: "Hello\r\nHello", date_performed: "2014/03/20",
        work_entry_durations_attributes: { '0' => {kind_code: 'nonbillable_pto', duration: 0}}, 
        work_entry_fees_attributes: { '0' => {fee: 0}} }
      post '/api/work_entries.json', params: {  work_entry: _params }
      response.status.should == 200
      result = JSON.parse(response.body)
      result['description'].should_not include("\r\n")
    end
  end
  describe "PUT work_entries" do
    before(:each) do
      @root = FactoryBot.create :work_chart, id: 1, display_label: 'Top node'
      @endpoint = FactoryBot.create :work_chart, id: 2, display_label: 'End Point', parent_id: @root.id
      @client = FactoryBot.create :work_chart, id: 3, display_label: 'Clients', parent_id: @endpoint.id
      @pto = FactoryBot.create :work_chart, id: 4, display_label: 'Paid Time Off', parent_id: @endpoint.id
      FactoryBot.create(:work_entry)
      FactoryBot.create :duration_kind, code: 'nonbillable_pto', production_category_id: ProductionCategory.count > 0 ? ProductionCategory.last.id : FactoryBot.create(:production_category).id, abbr_label: 'NBTO'
      @work_entry = WorkEntries::CreateWorkEntry.run(work_chart_id: @client.id, description: "Test work entry", fee: 0, user: @user, durations: [ {kind_code: 'nonbillable_pto', duration: 0} ], date_performed: 1.week.ago.to_date).result
    end
    it "validates mac line endings converted to UNIX in work entry" do
      _params = { id: @work_entry.id, work_chart_id: @work_entry.work_chart_id, description: "Hello\rHello", date_performed: "2014/03/20", work_entry_durations_attributes: { '0' => {id: @work_entry.work_entry_durations.first.id, kind_code: 'nonbillable_pto', duration: 0}}, work_entry_fees_attributes: { '0' => {fee: 0}}, role_id: @user.role_id }
      put "/api/work_entries/#{@work_entry.id}.json", params: {  work_entry: _params }
      response.status.should == 200
      result = JSON.parse(response.body)
      result['description'].should_not include("\r")
    end
    it "validates windows line endings converted to UNIX in work entry" do
      _params = { id: @work_entry.id, work_chart_id: @work_entry.work_chart_id, description: "Hello\r\nHello", date_performed: "2014/03/20", work_entry_durations_attributes: { '0' => {id: @work_entry.work_entry_durations.first.id, kind_code: 'nonbillable_pto', duration: 0}}, work_entry_fees_attributes: { '0' => {fee: 0}} }
      put "/api/work_entries/#{@work_entry.id}.json", params: {  work_entry: _params }
      response.status.should == 200
      result = JSON.parse(response.body)
      result['description'].should_not include("\r\n")
    end
  end
end
