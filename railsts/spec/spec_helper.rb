# Coverage is opt-in (COVERAGE=true) so normal test runs have no overhead.
# Must start before any application code is loaded. See `make coverage`.
if ENV['COVERAGE']
  require 'simplecov'
  SimpleCov.start 'rails'
end

require 'rubygems'

ENV["RAILS_ENV"] ||= 'test'
require File.expand_path("../../config/environment", __FILE__)
require 'rspec/rails'
require 'capybara/rails'
require 'capybara/rspec'
require 'email_spec'

Dir[Rails.root.join("spec/support/**/*.rb")].each {|f| require f}

RSpec.configure do |config|
  config.include EmailSpec::Helpers
  config.include EmailSpec::Matchers
  config.include JsonSpec::Helpers
  config.include Mocha::ParameterMatchers

  config.include CleanDatabase

  config.include AuthenticationHelper
  config.include EntriesHelper
  config.include ChartsHelper
  config.include ReportsHelper
  config.include HoursInTheBankHelper
  config.include DatabaseObjects
  config.include Devise::Test::ControllerHelpers, type: :controller
  config.include ActiveSupport::Testing::TimeHelpers

  config.infer_spec_type_from_file_location!
  config.expect_with(:rspec) { |c| c.syntax = [ :should, :expect ] }

  config.mock_with :mocha
  config.fixture_paths = ["#{::Rails.root}/spec/fixtures"]
  config.use_transactional_fixtures = true
  config.infer_base_class_for_anonymous_controllers = false
  config.order = "random"

  silence_warnings do
    Dir["#{Rails.root}/app/models/**/*.rb"].each {|f| load f}
    Dir["#{Rails.root}/app/controllers/**/*.rb"].each {|f| load f}
    Dir["#{Rails.root}/app/requests/**/*.rb"].each {|f| load f}
    Dir["#{Rails.root}/lib/*.rb"].each {|f| load f}
    FactoryBot.reload
    Dir[Rails.root.join("spec/support/**/*.rb")].each {|f| load f}
  end

  config.before(:all) do
    destroy_all_objects
  end
end

Shoulda::Matchers.configure do |config|
  config.integrate do |with|
    with.test_framework :rspec
    with.library :rails
  end
end

