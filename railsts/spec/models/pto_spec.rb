require 'spec_helper'

describe Pto do

  before(:each) do
    @today = DateTime.now
    @root_chart = FactoryBot.create :work_chart, id: 1, display_label: 'Top Node'
    @endpoint = FactoryBot.create :work_chart, id: 2, display_label: 'End Point', parent_id: @root_chart.id
    @vacation_chart = FactoryBot.create(:work_chart, id: 3, display_label: "Vacation", parent_id: @endpoint.id)
    @holiday_chart = FactoryBot.create(:work_chart, id: 4, display_label: "Holiday", parent_id: @endpoint.id)
    @sick_chart = FactoryBot.create(:work_chart, id: 5, display_label: "Sick Time", parent_id: @endpoint.id)
    @production_category = FactoryBot.create(:production_category)
    FactoryBot.create :duration_kind, code: 'nonbillable_pto', production_category_id: @production_category.id, abbr_label: 'PTO', date_created: DateTime.now
  end

  it "returns valid ptos for End Pointer's who's start date is less than a year ago" do
    @locked_date = DateTime.parse('2014-06-05') #Started getting test failures in Jan 2015 :P

    @newHire = FactoryBot.create(:user, email: "newHire@endpointdev.com", start_date: @locked_date - 4.weeks)
    
    WorkEntries::CreateWorkEntry.run!(work_chart_id: @holiday_chart.id, description: "asdasdsd", fee: 0, user: @newHire, durations: [{kind_code: "nonbillable_pto", duration: 960}], date_performed: @locked_date - 1.week)
    WorkEntries::CreateWorkEntry.run!(work_chart_id: @vacation_chart.id, description: "asdasdsd", fee: 0, user: @newHire, durations: [{kind_code: "nonbillable_pto", duration: 1440}], date_performed: @locked_date - 1.week) 
    WorkEntries::CreateWorkEntry.run!(work_chart_id: @sick_chart.id, description: "asdasdsd", fee: 0, user: @newHire, durations: [{kind_code: "nonbillable_pto", duration: 480}], date_performed: @locked_date - 1.week)

    @ptos = Pto.rundown_for(@newHire, @locked_date)
    @ptos.fetch(:holiday).should eq(16)
    @ptos.fetch(:last_year_holiday).should eq(0)
    @ptos.fetch(:vacations).should eq(24)
    @ptos.fetch(:last_year_vacation).should eq(0)
    @ptos.fetch(:sicks).should eq(8)
    @ptos.fetch(:last_year_sicks).should eq(0)
  end

  it "returns valid ptos for End Pointer's who's start date was more than a year ago, with anniversary today" do
    @locked_date = DateTime.parse('2014-06-05') #Started getting test failures in Jan 2015 :P
    @oldHire = FactoryBot.create(:user, email: "oldHire@endpointdev.com", start_date: @locked_date - 4.years)
    #this year
    @holiday = WorkEntries::CreateWorkEntry.run(work_chart_id: @holiday_chart.id, description: "asdasdsd", fee: 0, user: @oldHire, durations: [{kind_code: "nonbillable_pto", duration: 1440}], date_performed: @locked_date).result
    @vacation = WorkEntries::CreateWorkEntry.run(work_chart_id: @vacation_chart.id, description: "asdasdsd", fee: 0, user: @oldHire, durations: [{kind_code: "nonbillable_pto", duration: 1440}], date_performed: @locked_date).result
    @sick = WorkEntries::CreateWorkEntry.run(work_chart_id: @sick_chart.id, description: "asdasdsd", fee: 0, user: @oldHire, durations: [{kind_code: "nonbillable_pto", duration: 1440}], date_performed: @locked_date).result
    #last year
    WorkEntries::CreateWorkEntry.run(work_chart_id: @holiday_chart.id, description: "asdasdsd", fee: 0, user: @oldHire, durations: [{kind_code: "nonbillable_pto", duration: 960}], date_performed: @locked_date - 1.year).result
    
    WorkEntries::CreateWorkEntry.run(work_chart_id: @vacation_chart.id, description: "asdasdsd", fee: 0, user: @oldHire, durations: [{kind_code: "nonbillable_pto", duration: 960}], date_performed: @locked_date - 1.year).result
    WorkEntries::CreateWorkEntry.run(work_chart_id: @vacation_chart.id, description: "asdasdsd", fee: 0, user: @oldHire, durations: [{kind_code: "nonbillable_pto", duration: 1440}], date_performed: @locked_date - 3.months).result

    WorkEntries::CreateWorkEntry.run(work_chart_id: @sick_chart.id, description: "asdasdsd", fee: 0, user: @oldHire, durations: [{kind_code: "nonbillable_pto", duration: 960}], date_performed: @locked_date - 1.year).result
    WorkEntries::CreateWorkEntry.run(work_chart_id: @sick_chart.id, description: "asdasdsd", fee: 0, user: @oldHire, durations: [{kind_code: "nonbillable_pto", duration: 1440}], date_performed: @locked_date - 3.months).result
    
    @ptos = Pto.rundown_for(@oldHire, @locked_date)
    @ptos.fetch(:holiday).should eq(24)
    @ptos.fetch(:last_year_holiday).should eq(16)
    @ptos.fetch(:vacations).should eq(24)
    @ptos.fetch(:last_year_vacation).should eq(40)
    @ptos.fetch(:sicks).should eq(24)
    @ptos.fetch(:last_year_sicks).should eq(40)
  end

  it "returns valid ptos for End Pointer's who's start date was more than a year ago, whose anniversary didn't happen yet this year" do
    @not_yet = FactoryBot.create(:user, email: "tomorrow@endpointdev.com", start_date: DateTime.now - 4.years + 1.month)
    #this year
    WorkEntries::CreateWorkEntry.run(work_chart_id: @holiday_chart.id, description: "asdasdsd", fee: 0, user: @not_yet, durations: [{kind_code: "nonbillable_pto", duration: 1440}], date_performed: Date.today).result
    
    WorkEntries::CreateWorkEntry.run(work_chart_id: @vacation_chart.id, description: "asdasdsd", fee: 0, user: @not_yet, durations: [{kind_code: "nonbillable_pto", duration: 1440}], date_performed: Date.today).result
    WorkEntries::CreateWorkEntry.run(work_chart_id: @vacation_chart.id, description: "asdasdsd", fee: 0, user: @not_yet, durations: [{kind_code: "nonbillable_pto", duration: 960}], date_performed: Date.today - 3.months).result

    @sick = WorkEntries::CreateWorkEntry.run(work_chart_id: @sick_chart.id, description: "asdasdsd", fee: 0, user: @not_yet, durations: [{kind_code: "nonbillable_pto", duration: 1440}], date_performed: Date.today).result
    WorkEntries::CreateWorkEntry.run(work_chart_id: @sick_chart.id, description: "asdasdsd", fee: 0, user: @not_yet, durations: [{kind_code: "nonbillable_pto", duration: 960}], date_performed: Date.today - 3.months).result
    #last year
    WorkEntries::CreateWorkEntry.run(work_chart_id: @holiday_chart.id, description: "asdasdsd", fee: 0, user: @not_yet, durations: [{kind_code: "nonbillable_pto", duration: 960}], date_performed: 1.year.ago.to_date).result
    WorkEntries::CreateWorkEntry.run(work_chart_id: @vacation_chart.id, description: "asdasdsd", fee: 0, user: @not_yet, durations: [{kind_code: "nonbillable_pto", duration: 960}], date_performed: 1.year.ago.to_date).result
    WorkEntries::CreateWorkEntry.run(work_chart_id: @sick_chart.id, description: "asdasdsd", fee: 0, user: @not_yet, durations: [{kind_code: "nonbillable_pto", duration: 960}], date_performed: 1.year.ago.to_date).result
    
    @ptos = Pto.rundown_for(@not_yet, @today)
    @ptos.fetch(:holiday).should eq(24)
    @ptos.fetch(:last_year_holiday).should eq(16)
    @ptos.fetch(:vacations).should eq(40)
    @ptos.fetch(:last_year_vacation).should eq(16)
    @ptos.fetch(:sicks).should eq(40)
    @ptos.fetch(:last_year_sicks).should eq(16)
  end

  it "returns valid ptos for End Pointer's who's start date was more than a year ago, with anniversary that already happened this year" do
    @already = FactoryBot.create(:user, email: "tomorrow@endpointdev.com", start_date: DateTime.now - 4.years - 1.month)
    #this year
    @holiday = WorkEntries::CreateWorkEntry.run!(work_chart_id: @holiday_chart.id, description: "asdasdsd", fee: 0, user: @already, durations: [{kind_code: "nonbillable_pto", duration: 1440}], date_performed: Date.today)
    WorkEntries::CreateWorkEntry.run!(work_chart_id: @vacation_chart.id, description: "asdasdsd", fee: 0, user: @already, durations: [{kind_code: "nonbillable_pto", duration: 1440}], date_performed: Date.today)
    WorkEntries::CreateWorkEntry.run!(work_chart_id: @sick_chart.id, description: "asdasdsd", fee: 0, user: @already, durations: [{kind_code: "nonbillable_pto", duration: 1440}], date_performed: Date.today)
    #last year
    @holiday0 = WorkEntries::CreateWorkEntry.run!(work_chart_id: @holiday_chart.id, description: "asdasdsd", fee: 0, user: @already, durations: [{kind_code: "nonbillable_pto", duration: 960}], date_performed: 1.year.ago.to_date)
    
    WorkEntries::CreateWorkEntry.run!(work_chart_id: @vacation_chart.id, description: "asdasdsd", fee: 0, user: @already, durations: [{kind_code: "nonbillable_pto", duration: 960}], date_performed: 1.year.ago.to_date)
    WorkEntries::CreateWorkEntry.run!(work_chart_id: @vacation_chart.id, description: "asdasdsd", fee: 0, user: @already, durations: [{kind_code: "nonbillable_pto", duration: 1440}], date_performed: Date.today - 3.months)

    WorkEntries::CreateWorkEntry.run!(work_chart_id: @sick_chart.id, description: "asdasdsd", fee: 0, user: @already, durations: [{kind_code: "nonbillable_pto", duration: 960}], date_performed: 1.year.ago.to_date)
    WorkEntries::CreateWorkEntry.run!(work_chart_id: @sick_chart.id, description: "asdasdsd", fee: 0, user: @already, durations: [{kind_code: "nonbillable_pto", duration: 1440}], date_performed: Date.today - 3.months)

    @ptos = Pto.rundown_for(@already, @today)
    @ptos.fetch(:holiday).should eq(24)
    @ptos.fetch(:last_year_holiday).should eq(16)
    @ptos.fetch(:vacations).should eq(24)
    @ptos.fetch(:last_year_vacation).should eq(40)
    @ptos.fetch(:sicks).should eq(24)
    @ptos.fetch(:last_year_sicks).should eq(40)
  end

  it "should calculate vacation time using aniversary year period" do
    # Given - an employee that started working 2 years and one month ago...
    # (Their anniversary was 1 month ago from today)
    test_user = FactoryBot.create(
      :user,
      email: "someone@endpointdev.com",
      start_date: (DateTime.now - 2.years - 1.month)
    )

    # And - has a work entry of 24 hours worth of vacation time done today...
    # (Today is within their current anniversary period. I.e. between this year's anniversary and next year's anniversary)
    WorkEntries::CreateWorkEntry.run!(
      work_chart_id: @vacation_chart.id,
      description: "test vacation time",
      fee: 0,
      user: test_user,
      durations: [{ kind_code: "nonbillable_pto", duration: 24 * 60 }],
      date_performed: Date.today
    )

    # When - calculating vacations for the current anniversary period...
    pto_rundown = Pto.rundown_for(test_user, Date.today)

    # Then - they should have accrued 24 hours of vacation time for this period
    pto_rundown.fetch(:vacations).should eq(24)
  end

  it "should not include out-of-anniversary-period time when calculating vacation time" do
    # Given - an employee that started working 2 years and one month ago...
    # (Their anniversary was 1 month ago from today)
    test_user = FactoryBot.create(
      :user,
      email: "someone@endpointdev.com",
      start_date: (DateTime.now - 2.years - 1.month)
    )

    # And - has a work entry of 24 hours worth of vacation time done one year ago...
    # (One year ago is NOT within their current anniversary period. I.e. between this year's anniversary and next year's anniversary)
    WorkEntries::CreateWorkEntry.run!(
      work_chart_id: @vacation_chart.id,
      description: "test vacation time",
      fee: 0,
      user: test_user,
      durations: [{ kind_code: "nonbillable_pto", duration: 24 * 60 }],
      date_performed: Date.today - 1.year
    )

    # When - calculating vacations for the current anniversary period...
    pto_rundown = Pto.rundown_for(test_user, Date.today)

    # Then - they should have accrued 0 hours of vacation time for this period
    pto_rundown.fetch(:vacations).should eq(0)
  end

  it "should not include out-of-anniversary-period time and include in-anniversary-period time when calculating vacation time" do
    # Given - an employee that started working 2 years and one month ago...
    # (Their anniversary was 1 month ago from today)
    test_user = FactoryBot.create(
      :user,
      email: "someone@endpointdev.com",
      start_date: (DateTime.now - 2.years - 1.month)
    )

    # And - has a work entry of 24 hours worth of vacation time done today...
    # (Today is within their current anniversary period. I.e. between this year's anniversary and next year's anniversary)
    WorkEntries::CreateWorkEntry.run!(
      work_chart_id: @vacation_chart.id,
      description: "test vacation time",
      fee: 0,
      user: test_user,
      durations: [{ kind_code: "nonbillable_pto", duration: 24 * 60 }],
      date_performed: Date.today
    )

    # And - has a work entry of 24 hours worth of vacation time done one year ago...
    # (One year ago is NOT within their current anniversary period. I.e. between this year's anniversary and next year's anniversary)
    WorkEntries::CreateWorkEntry.run!(
      work_chart_id: @vacation_chart.id,
      description: "test vacation time",
      fee: 0,
      user: test_user,
      durations: [{ kind_code: "nonbillable_pto", duration: 24 * 60 }],
      date_performed: Date.today - 1.year
    )

    # When - calculating vacations for the current anniversary period...
    pto_rundown = Pto.rundown_for(test_user, Date.today)

    # Then - they should have accrued 24 hours of vacation time for this period
    pto_rundown.fetch(:vacations).should eq(24)
  end

  it "should calculate sick time using aniversary year period" do
    # Given - an employee that started working 2 years and one month ago...
    # (Their anniversary was 1 month ago from today)
    test_user = FactoryBot.create(
      :user,
      email: "someone@endpointdev.com",
      start_date: (DateTime.now - 2.years - 1.month)
    )

    # And - has a work entry of 24 hours worth of sick time done today...
    # (Today is within their current anniversary period. I.e. between this year's anniversary and next year's anniversary)
    WorkEntries::CreateWorkEntry.run!(
      work_chart_id: @sick_chart.id,
      description: "test sick time",
      fee: 0,
      user: test_user,
      durations: [{ kind_code: "nonbillable_pto", duration: 24 * 60 }],
      date_performed: Date.today
    )

    # When - calculating sick time for the current anniversary period...
    pto_rundown = Pto.rundown_for(test_user, Date.today)

    # Then - they should have accrued 24 hours of sick time for this period
    pto_rundown.fetch(:sicks).should eq(24)
  end

  it "should not include out-of-anniversary-period time when calculating sick time" do
    # Given - an employee that started working 2 years and one month ago...
    # (Their anniversary was 1 month ago from today)
    test_user = FactoryBot.create(
      :user,
      email: "someone@endpointdev.com",
      start_date: (DateTime.now - 2.years - 1.month)
    )

    # And - has a work entry of 24 hours worth of sick time done one year ago...
    # (One year ago is NOT within their current anniversary period. I.e. between this year's anniversary and next year's anniversary)
    WorkEntries::CreateWorkEntry.run!(
      work_chart_id: @sick_chart.id,
      description: "test sick time",
      fee: 0,
      user: test_user,
      durations: [{ kind_code: "nonbillable_pto", duration: 24 * 60 }],
      date_performed: Date.today - 1.year
    )

    # When - calculating sick time for the current anniversary period...
    pto_rundown = Pto.rundown_for(test_user, Date.today)

    # Then - they should have accrued 0 hours of sick time for this period
    pto_rundown.fetch(:sicks).should eq(0)
  end

  it "should not include out-of-anniversary-period time and include in-anniversary-period time when calculating sick time" do
    # Given - an employee that started working 2 years and one month ago...
    # (Their anniversary was 1 month ago from today)
    test_user = FactoryBot.create(
      :user,
      email: "someone@endpointdev.com",
      start_date: (DateTime.now - 2.years - 1.month)
    )

    # And - has a work entry of 24 hours worth of sick time done today...
    # (Today is within their current anniversary period. I.e. between this year's anniversary and next year's anniversary)
    WorkEntries::CreateWorkEntry.run!(
      work_chart_id: @sick_chart.id,
      description: "test sick time",
      fee: 0,
      user: test_user,
      durations: [{ kind_code: "nonbillable_pto", duration: 24 * 60 }],
      date_performed: Date.today
    )

    # And - has a work entry of 24 hours worth of sick time done one year ago...
    # (One year ago is NOT within their current anniversary period. I.e. between this year's anniversary and next year's anniversary)
    WorkEntries::CreateWorkEntry.run!(
      work_chart_id: @sick_chart.id,
      description: "test sick time",
      fee: 0,
      user: test_user,
      durations: [{ kind_code: "nonbillable_pto", duration: 24 * 60 }],
      date_performed: Date.today - 1.year
    )

    # When - calculating sick time for the current anniversary period...
    pto_rundown = Pto.rundown_for(test_user, Date.today)

    # Then - they should have accrued 24 hours of sick time for this period
    pto_rundown.fetch(:sicks).should eq(24)
  end

  it "should not take calendar year into consideration when calculating vacation time" do
    # Given - an employee that started working on February 2016...
    test_user = FactoryBot.create(
      :user,
      email: "someone@endpointdev.com",
      start_date: DateTime.new(2016, 2, 1)
    )

    # And - a current date of November 2018...
    current_date = Date.new(2018, 11, 1);

    # And - the employee has a work entry of 24 hours worth of vacation time done on January 2019...
    # (January 2019 is an example of a date that's outside the current calendar year but within the current anniversary period.
    # I.e. it is between the last anniversary (2018-02-01) and the next anniversary (2019-02-01))
    WorkEntries::CreateWorkEntry.run!(
      work_chart_id: @vacation_chart.id,
      description: "test vacation time",
      fee: 0,
      user: test_user,
      durations: [{ kind_code: "nonbillable_pto", duration: 24 * 60 }],
      date_performed: Date.new(2019, 1, 15)
    )

    # When - calculating vacations for the current anniversary period...
    pto_rundown = Pto.rundown_for(test_user, current_date)

    # Then - they should have accrued 24 hours of vacation time for this period
    # (Even though the work entry is outside the current calendar year, it is
    # within the current anniversary period, So it should be taken into consideration for the calculation)
    pto_rundown.fetch(:vacations).should eq(24)
  end

  it "should not take calendar year into consideration when calculating sick time" do
    # Given - an employee that started working on February 2016...
    test_user = FactoryBot.create(
      :user,
      email: "someone@endpointdev.com",
      start_date: DateTime.new(2016, 2, 1)
    )

    # And - a current date of November 2018...
    current_date = Date.new(2018, 11, 1);

    # And - the employee has a work entry of 24 hours worth of sick time done on January 2019...
    # (January 2019 is an example of a date that's outside the current calendar year but within the current anniversary period.
    # I.e. it is between the last anniversary (2018-02-01) and the next anniversary (2019-02-01))
    WorkEntries::CreateWorkEntry.run!(
      work_chart_id: @vacation_chart.id,
      description: "test vacation time",
      fee: 0,
      user: test_user,
      durations: [{ kind_code: "nonbillable_pto", duration: 24 * 60 }],
      date_performed: Date.new(2019, 1, 15)
    )

    # When - calculating sick time for the current anniversary period...
    pto_rundown = Pto.rundown_for(test_user, current_date)

    # Then - they should have accrued 24 hours of sick time for this period
    # (Even though the work entry is outside the current calendar year, it is
    # within the current anniversary period, so it should be taken into consideration for the calculation)
    pto_rundown.fetch(:vacations).should eq(24)
  end
end
