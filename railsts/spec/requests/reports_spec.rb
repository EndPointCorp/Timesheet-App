require 'spec_helper'

describe Report do 
  before(:each) do
    @user = create_correct_user
    login_sucessfully
    @root = FactoryGirl.create :work_chart, id: 1, display_label: 'Top node'
    @endpoint = FactoryGirl.create :work_chart, id: 2, display_label: 'End Point', parent_id: @root.id
    @client = FactoryGirl.create :work_chart, id: 3, display_label: 'Clients', parent_id: @endpoint.id
  end
end
