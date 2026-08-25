When(/^I access the login page$/) do
  visit "/#/login"
end

Then(/^I should see the login form$/) do
  expect(page).to have_selector('form#login-form')
end

Then(/^I should see the "(.+)" field$/) do |field|
  expect(page).to have_selector("form#login-form input[placeholder=#{field}]")
end

Then(/^the "(.+)" field should be of the "(.+)" type$/) do |placeholder, type|
  expect(page).to have_selector("form#login-form input[placeholder=#{placeholder}][type=#{type}]")
end

Then(/^I should see the "(.+)" button$/) do |name|
  find_button name
end

Given(/^there is a "([^"]*)" user with a "([^"]*)" password$/) do |email, password|
  FactoryGirl.create :user,
    email: email,
    password: password,
    password_confirmation: password
end

When(/^I fill in "([^"]*)" in the "([^"]*)" field$/) do |value, field|
  fill_in field, with: value
end

When(/^I click on the "([^"]*)" button$/) do |name|
  click_button name
end

Then(/^I should see "([^"]*)" message$/) do |message|
  gtoast = page.find ".gtoast"
  expect(gtoast.text).to eq(message)
end

Then(/^I should( not)? get redirected to the main calendar page$/) do |negate|
  expect_angular_route "/#/", negate: negate.present?
end

Given(/^that I have a normal user$/) do
  FactoryGirl.create :user,
    email: 'tester@endpointdev.com',
    password: 'ABCDefgh1234',
    password_confirmation: 'ABCDefgh1234'
end

Given(/^that I'm logged in$/) do
  visit "/#/login"
  fill_in "Email", with: "tester@endpointdev.com"
  fill_in "Password", with: "ABCDefgh1234"
  click_button "Sign in"
  expect_angular_route "/#/"
  wait_for_charts_loaded
end

Given(/^I don't have any entries in the current month$/) do
  expect(WorkEntry.where(role_id: Role.joins(:user).where("users.email = ?", "tester@endpointdev.com").select(:id)).
    where('extract(month from date_performed) = ? and extract(year from date_performed) = ?', DateTime.now.month, DateTime.now.year).
    count).to eq(0)
end

When(/^I access the main calendar page$/) do
  visit "/#/"
end

Then(/^I should see all day totals showing "([^"]*)"$/) do |text|
  page.assert_selector('#calendar .total-all', :minimum => DateTime.now.end_of_month.day, :visible => :all)
  page.assert_selector('#calendar .total-all', :minimum => DateTime.now.day, :visible => :all, :text => text)
end

Given(/^I'm logged in as a manager$/) do
  u = FactoryGirl.create :user_with_nonimmediate_superuser,
    email: 'tester@endpointdev.com',
    password: 'ABCDefgh1234',
    password_confirmation: 'ABCDefgh1234'
  puts "Is new features tester? #{u.is_new_features_tester?}"
  visit "/#/login"
  fill_in "Email", with: "tester@endpointdev.com"
  fill_in "Password", with: "ABCDefgh1234"
  click_button "Sign in"
  expect_angular_route "/#/"
  wait_for_charts_loaded
end

Given(/^There's a client named "([^"]*)"$/) do |display_name|
  FactoryGirl.create :client_work_chart, display_label: display_name
end

Given(/^There's a (recurring |)(cumulative |zero-out |)transaction for "([^"]*)"/) do |recurring, mode, name|
  factory = recurring.empty? ? :transaction : :monthly_recurring_transaction
  FactoryGirl.create factory, work_chart_id: WorkChart.where(display_label: name).first.id,
    user_id: User.first.id,
    mode: mode.strip.empty? ? "cumulative" : mode.strip
end

When(/^I access the charts editor$/) do
  visit "/#/work_charts/editor"
end

When(/^I select "([^"]*)" in the charts selector$/) do |name|
  ChartLabel.where(id: WorkChart.where(display_label: name).select(:id)).first.labels.each do |label|
    wait_for_ajax
    wait_for_charts_loaded

    puts "Selecting '#{label}' from the charts multi select"
    within ".charts-multi-select:last-child" do
      select label
    end
  end
end

When(/^I choose the "([^"]*)" tab$/) do |tab_name|
  click_on tab_name
end

Then(/^I should( not|) see (\d+) transaction on the list$/) do |negation, num|
  wait_for_charts_loaded
  sleep 2
  expectation = negation.empty? ? :to : :not_to
  expect(all('.transaction-preview').count).send(expectation, eq(num.to_i))
end

Then(/^I should( not|) see a string "([^"]+)" in the (\d+st|\dnd|\dth) transaction on the list$/) do |negation, what, num|
  wait_for_ajax
  expectation = negation.empty? ? :to : :not_to
  node = all('.transaction-preview').at(num.to_i - 1)

  expect(node).send(expectation, have_content(what))
end
