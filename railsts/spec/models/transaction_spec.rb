require 'spec_helper'

describe Transaction do
  it { should have_db_column(:mode) }
  it { should validate_inclusion_of(:mode).in_array(['cumulative', 'zero-out']) }
  it { should validate_presence_of(:mode) }

  it "has a valid transaction factory" do
    FactoryBot.build(:transaction).should be_valid
  end

  it "is not able to have hours that do not round up to 15 minutes" do
    chart = create_proper_chart
    [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0, 1.125].each do |n|
      expectation = expect { FactoryBot.create :transaction, work_chart: chart, hours: n }
      if n % 0.25 == 0
        expectation.to_not raise_error
      else
        expectation.to raise_error(ActiveRecord::StatementInvalid)
      end
    end
  end
end
