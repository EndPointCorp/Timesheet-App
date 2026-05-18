require 'spec_helper'

describe WorkEntryAudit do

  before(:each) do
  end

  it 'has a valid factory' do
    FactoryGirl.create(:work_entry_audit).should be_valid
  end

end
