namespace :cron do
  desc "Runs all currently matching internal cron jobs"
  task tick: :environment do
    System::TickCron.run!
  end
end
