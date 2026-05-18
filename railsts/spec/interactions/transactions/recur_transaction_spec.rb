require 'spec_helper'

describe Transactions::RecurTransaction do
  describe "Recurring transactions" do
    let(:not_recurring_transaction) { FactoryGirl.create :transaction }
    let(:recurring_transaction) { FactoryGirl.create :monthly_recurring_transaction, mode: 'zero-out' }
    let(:recurring_transaction_cumulative) { FactoryGirl.create :monthly_recurring_transaction, mode: 'cumulative' }
    let(:inputs) { { transaction: recurring_transaction } }
    let(:inputs_cumulative) { { transaction: recurring_transaction_cumulative } }
    let(:inputs_not_recurring) { { transaction: not_recurring_transaction } }
    let(:failing_non_recurring_interaction) { Transactions::RecurTransaction.run inputs_not_recurring }
    let(:recurrance) do
      inputs
      travel_to 1.month.since
      Transactions::RecurTransaction.run inputs
    end
    let(:recurrance_cumulative) do
      inputs_cumulative
      travel_to 1.month.since
      Transactions::RecurTransaction.run inputs_cumulative
    end

    after(:each) { travel_back }

    it "fails for not recurring transactions" do
      expect(failing_non_recurring_interaction).not_to be_valid
    end

    it "is valid for recurring transactions" do
      expect(recurrance).to be_valid
    end

    it "assigns the date_closed when mode is zero-out" do
      expect(recurrance.result.id).not_to eq(recurring_transaction.id)
      expect(recurring_transaction.reload.date_closed).to eq(DateTime.now.to_date)
    end

    it "leaves the date_closed as empty when mode is cumulative" do
      expect(recurrance_cumulative.result.id).not_to eq(recurring_transaction_cumulative.id)
      expect(recurring_transaction_cumulative.reload.date_closed).to be_nil
    end
  end
end


