require 'spec_helper'

describe "Time zones" do
  before(:each) do
    # create_correct_user seeds a visible US/Eastern (utc_offset -5) zone.
    @user = create_correct_user
    login_sucessfully
  end

  describe "GET /time_zones.json" do
    it "lists visible master zones, ordered by offset, as {code, utc_offset} objects" do
      # Inserted out of offset order on purpose: this assertion fails if
      # .order(:utc_offset) is dropped from TimeZone.visible.
      FactoryBot.create(:time_zone, code: 'Asia/Kolkata',   utc_offset: 5.5, is_visible: true)
      FactoryBot.create(:time_zone, code: 'US/Pacific',     utc_offset: -8,  is_visible: true)
      FactoryBot.create(:time_zone, code: 'Europe/London',  utc_offset: 0,   is_visible: true)
      FactoryBot.create(:time_zone, code: 'Nowhere/Hidden', utc_offset: 12,  is_visible: false)

      get '/api/time_zones.json'

      response.should be_successful
      body = JSON.parse(response.body)
      body.should be_an(Array)

      codes = body.map { |z| z['code'] }
      # from the master table, not from users' distinct zones
      codes.should include('US/Eastern', 'US/Pacific', 'Europe/London', 'Asia/Kolkata')
      # is_visible = false is excluded
      codes.should_not include('Nowhere/Hidden')

      # These known zones, listed here in ascending-offset order, must appear in
      # the same relative order in the response.
      offset_ordered = ['US/Pacific', 'US/Eastern', 'Europe/London', 'Asia/Kolkata']
      positions = offset_ordered.map { |c| codes.index(c) }
      positions.should eq(positions.sort)

      # objects carry the numeric offset
      body.find { |z| z['code'] == 'Europe/London' }['utc_offset'].should eq(0)
      body.find { |z| z['code'] == 'Asia/Kolkata' }['utc_offset'].should eq(5.5)
    end
  end
end
