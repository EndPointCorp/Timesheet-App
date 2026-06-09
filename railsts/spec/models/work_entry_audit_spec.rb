require 'spec_helper'

describe WorkEntryAudit do

  before(:each) do
  end

  it 'has a valid factory' do
    FactoryBot.create(:work_entry_audit).should be_valid
  end

end
