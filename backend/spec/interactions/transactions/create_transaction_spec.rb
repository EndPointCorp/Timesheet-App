require 'spec_helper'

describe Transactions::CreateTransaction do
  let(:user) { create_correct_user "developer1@example.com" }
  let(:bar) { FactoryBot.create :client_work_chart, display_label: "Bar" }
  let(:inputs) do
    {
      hours: 123,
      user_id: user.id,
      mode: 'cumulative',
      description: "I'm a description",
      date: 1.day.ago.to_date,
      work_chart_id: bar.id
    }
  end
  let(:inputs_no_mode) { inputs.reject { |k, _| k == :mode } }
  let(:creation) do
    Transactions::CreateTransaction.run inputs
  end
  let(:creation_no_mode) do
    Transactions::CreateTransaction.run inputs_no_mode
  end
  let(:transaction) { creation.result }

  it "should be a valid interaction given valid inputs" do
    expect(creation).to be_valid
  end

  it "should be invalid interaction given inputs without mode" do
    expect(creation_no_mode).not_to be_valid
  end

  it "creates the transaction with given hours, description and date" do
    expect(transaction.date).to eq(1.day.ago.to_date)
    expect(transaction.work_chart_id).to eq(bar.id)
    expect(transaction.user_id).to eq(user.id)
    expect(transaction.hours).to eq(123)
    expect(transaction.description).to eq("I'm a description")
  end
end

