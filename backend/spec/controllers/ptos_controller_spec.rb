require 'spec_helper'
require 'json'

describe PtosController do
  describe "GET 'index'" do
    before(:each) do
      # Setting up Devise's current_user
      @request.env["devise.mapping"] = Devise.mappings[:user]

      # Setting up supporting data
      root_chart = FactoryBot.create :work_chart, id: 1, display_label: 'Top Node'
      endpoint = FactoryBot.create :work_chart, id: 2, display_label: 'End Point', parent_id: root_chart.id
      @vacation_chart = FactoryBot.create(:work_chart, id: 3, display_label: "Vacation", parent_id: endpoint.id)
      holiday_chart = FactoryBot.create(:work_chart, id: 4, display_label: "Holiday", parent_id: endpoint.id)
      sick_chart = FactoryBot.create(:work_chart, id: 5, display_label: "Sick Time", parent_id: endpoint.id)
      production_category = FactoryBot.create(:production_category)

      FactoryBot.create(
        :duration_kind,
        code: 'nonbillable_pto',
        production_category_id: production_category.id,
        abbr_label: 'PTO',
        date_created: DateTime.now
      )
    end

    # Given - an employee that started working 2 years and one month ago...
    # And - the employee is logged in...
    # And - the employee has a work entry of 24 hours worth of vacation time done today...
    # When - the PTO rundown is requested...
    # Then - that employee's vacations are calculated.
    it 'should calculate vacations for logged in user' do
      # Given - an employee that started working 2 years and one month ago...
      test_user = FactoryBot.create(
        :user,
        email: 'someone@endpointdev.com',
        start_date: (DateTime.now - 2.years - 1.month)
      )

      # And - the employee is logged in...
      sign_in test_user

      # And - the employee has a work entry of 24 hours worth of vacation time done today...
      WorkEntries::CreateWorkEntry.run!(
        work_chart_id: @vacation_chart.id,
        description: 'test vacation time',
        fee: 0,
        user: test_user,
        durations: [{ kind_code: 'nonbillable_pto', duration: 24 * 60 }],
        date_performed: Date.today
      )

      # When - the PTO rundown is requested...
      get 'index'

      # Then - that employee's vacations are calculated.
      parsed_response = JSON.parse(response.body)
      parsed_response['vacations'].should eq(24)
    end

    # Given - an employee that started working 2 years and one month ago...
    # And - the employee is a super user...
    # And - the employee is logged in...
    # And - there's another employee...
    # And - that other employee has a work entry of 10 hours worth of vacation time done today...
    # And - the first employee has impersonated the second employee
    # When - the PTO rundown is requested...
    # Then - the impersonated employee's vacations are calculated.
    it 'should calculate vacations for assumed user' do
      # Given - an employee that started working 2 years and one month ago...
      test_user = FactoryBot.create(
        :user,
        email: 'someone@endpointdev.com',
        start_date: (DateTime.now - 2.years - 1.month)
      )

      # And - the employee is a super user...
      grant_superuser

      # And - the employee is logged in...
      sign_in test_user

      # And - there's another employee...
      test_assumed_user = FactoryBot.create(
        :user,
        email: 'assumed@endpointdev.com',
        start_date: (DateTime.now - 2.years - 1.month)
      )

      # And - that other employee has a work entry of 10 hours worth of vacation time done today...
      WorkEntries::CreateWorkEntry.run!(
        work_chart_id: @vacation_chart.id,
        description: 'test vacation time',
        fee: 0,
        user: test_assumed_user,
        durations: [{ kind_code: 'nonbillable_pto', duration: 10 * 60 }],
        date_performed: Date.today
      )

      # And - the first employee has impersonated the second employee
      ptos_controller = @controller
      @controller = UsersController.new
      post 'assume', params: { email: test_assumed_user.email }

      # When - the PTO rundown is requested...
      @controller = ptos_controller
      get 'index'

      # Then - the impersonated employee's vacations are calculated.
      parsed_response = JSON.parse(response.body)
      parsed_response['vacations'].should eq(10)
    end
  end
end
