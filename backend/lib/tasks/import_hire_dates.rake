require 'csv'

namespace :import do
  desc "Adds all user's hire date"
  task hire_dates: :environment do

    puts "Preparing to import End Pointer's start dates"

    csv = File.expand_path("../../../import/hire_dates.csv", __FILE__)
    CSV.foreach csv, headers: true do |line|
      employee = User.find_by_name("#{line['name']}")
      employee.start_date = "#{line['firstDay']}"
      employee.save!
      puts "#{line['name']}'s start date saved!"
    end
    puts "Import complete"
  end
end

