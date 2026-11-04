require 'spec_helper'
require 'json'

describe WorkMonthsController do
  render_views

  describe "GET 'index'" do

    let(:year_start) { Date.today.beginning_of_year }
    let(:last_year_start) { year_start - 1.year }
    let(:month_start) { last_year_start + 1.month }
    let(:month_end) { last_year_start + 3.month }
    let(:total_available) do
      (month_end.beginning_of_month..month_end.end_of_month).reject do |day|
        day.wday == 0 || day.wday == 6
      end.count * 8 * 60
    end
    let(:work_chart) { FactoryBot.create :work_chart }
    let(:user) { stub(id: 40, email: 'tester@example.com', time_zone_code: nil) }
    let(:index_result) do
      get 'index', params: { start: month_start, end: month_end }, xhr: true
      JSON.parse response.body
    end

    before(:each) do
      work_chart
      WorkDay.stubs(:by_year_and_month).returns([])
      WorkMonthsController.any_instance.stubs(:ensure_logged_in).returns(true)
      WorkMonthsController.any_instance.stubs(:effective_user).returns(user)
    end

    it "returns proper number of months" do
      expect(index_result.count).to eq 3
    end

    it "returns proper number of hours available" do
      expect(index_result.first["available"]).to eq(total_available)
    end
  end

end
