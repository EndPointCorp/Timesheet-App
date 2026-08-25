require 'cucumber/rails'
require 'capybara/cucumber'
require 'capybara/webkit'
require 'minitest/spec'
require 'headless'
require 'capybara-screenshot/cucumber'
require Rails.root.join('spec/support/clean_database.rb')

ActionController::Base.allow_rescue = false

Cucumber::Rails::Database.javascript_strategy = :transaction
Cucumber::Rails::Database.autorun_database_cleaner = false

Capybara.current_driver = :webkit
Capybara.javascript_driver = :webkit

headless = Headless.new
headless.start

Before do
  cleaner = Cleaner.new
  cleaner.destroy_all_objects
  cleaner.create_dictionaries
  Capybara.reset_sessions!
end

module TimesheetAppWorld
  def expect_angular_route(path, options = {})
    negate = options.fetch(:negate, false)
    page.document.synchronize(5) do
      uri = URI.parse(current_url)
      _current_angular_route = uri.to_s.split(uri.port.to_s).last
      if !negate && _current_angular_route != path
        raise Capybara::ExpectationNotMet,
	  "expected redirect to angular route: #{path} but the path seemed to stay at #{_current_angular_route}"
      end
      if negate && _current_angular_route == path
        raise Capybara::ExpectationNotMet,
	  "expected not redirect to angular route: #{path} but the path seemed to move to #{_current_angular_route}"
      end
    end
  end

  def wait_for_charts_loaded
    Timeout.timeout(3) do
      while not charts_loaded?
        sleep 0.01
      end
    end
  end

  def wait_for_ajax
    Timeout.timeout(3) do
      while not ajax_finished?
        sleep 0.01
      end
    end
  end

  def ajax_finished?
    js = <<-JS
      var req = window['_request'];
      req === undefined || req === null || req === false;
    JS
    page.evaluate_script(js)
  end

  def charts_loaded?
    js = <<-JS
      var rawCharts = localStorage['rawCharts'];
      rawCharts !== undefined && rawCharts !== null && rawCharts.length !== 0;
    JS
    page.evaluate_script(js)
  end
end

World(TimesheetAppWorld)
