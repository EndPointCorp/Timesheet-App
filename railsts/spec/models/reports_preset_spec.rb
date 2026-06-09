require 'spec_helper'

describe ReportsPreset do
  it "has a valid reports preset factory" do
    FactoryBot.create(:reports_preset).should be_valid
  end
end
