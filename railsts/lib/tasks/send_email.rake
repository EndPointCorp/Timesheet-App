namespace :mail do |args|
  desc "Sends daily nag emails"
  task send: :environment do
    ARGV.shift
    ARGV.shift
    options = {}
    OptionParser.new(args) do |opts|
      opts.banner = "Usage: rake mail:send [options]"
      opts.on("-u", "--user {username}","User's email address") do |user|
        options[:user] = user
      end
      opts.on("--all") do
        options[:all] = true
      end
      opts.on("-a", "--auto-time-zone") do
        options[:auto] = true
      end
      opts.on("-bd", "--bdate {begin_date}", "First day of date range") do |bdate|
        options[:bdate] = Time.zone.parse(bdate)
      end
      opts.on("-ed", "--edate {end_date}", "Last day of date range") do |edate|
        options[:edate] = Time.zone.parse(edate)
      end
      opts.on("-t", "--time-zone {timezone", "Specify time zone") do |time_zone|
        options[:time_zone] = time_zone
      end
      opts.on("-o", "--override-email {recipient}", "Add a recipient") do |override_email|
        options[:override_email] = override_email
      end
      opts.on("--simulate-timestamp {timestamp}", "Simulate timestamp") do |timestamp| # Only works if --auto is specified
        options[:timestamp] = timestamp
      end
    end.parse!

    # Check if two time zones are the same. Ex: "US/Eastern" and "Eastern Time (US & Canada)" are the same time zone.
    def zones_are_same(first, second)
      first = ActiveSupport::TimeZone.new(first)
      second = ActiveSupport::TimeZone.new(second)
      return first.utc_offset == second.utc_offset
    end

    if options[:all] # If all was specified
      active_user_email_addresses = User.naggable.select {|user| user.active?}.reject { |user| user.email == MAILER_FROM_EMAIL }.map(&:email)

      active_user_email_addresses.each do |email|
        if options[:override_email]
          puts "Sending all reports, using override email " + options[:override_email]
          UserReport.send_report(email, recipient: options[:override_email], simulate_timestamp: options[:timestamp])
        else
          puts "Sending all reports"
          UserReport.send_report(email, simulate_timestamp: options[:timestamp])
        end
      end
    elsif options[:time_zone] # If time zone is specified
      user_emails = User.naggable.select { |user| user.active? && zones_are_same(user.time_zone_code, options[:time_zone]) }.
                  reject { |user| user.email == MAILER_FROM_EMAIL }.
                  map(&:email)

      user_emails.uniq! # Make sure we don't have any duplicates

      user_emails.each do |email|
        if options[:override_email]
          puts "Sending automatic reports, using override email " + options[:override_email]
          UserReport.send_report(email, recipient: options[:override_email], simulate_timestamp: options[:timestamp])
        else
          puts "Sending automatic reports"
          UserReport.send_report(email, simulate_timestamp: options[:timestamp])
        end
      end
    elsif options[:auto] || options.empty? || (options.length == 1 && options[:timestamp]) # Check in which timezone it is currently 12 noon and send emails to all user in that timezone
      now = nil
      if options[:timestamp]
        print "Using custom timestamp: "
        now = ActiveSupport::TimeZone.new("UTC").parse(options[:timestamp]).to_time
        puts now
      else
        puts "No custom timestamp specified"
        now = Time.at((Time.now.to_f / 15.minutes).floor * 15.minutes).utc
      end

      def is_noon_in(zone, now)
        zone = ActiveSupport::TimeZone.new(zone)
        time_in_zone = zone.parse(now.to_s)
        return time_in_zone.hour == 12
      end

      user_emails = []
      User.naggable.select { |user| user.active? && is_noon_in(user.time_zone_code, now) }.
          reject { |user| user.email == MAILER_FROM_EMAIL }.
          map(&:email).each do |user|
        user_emails << user
      end

      puts "Matched users: " + user_emails.to_s
      user_emails.uniq! # Make sure we don't have any duplicates
 
      user_emails.each do |email|
        if options[:override_email]
          puts "Sending automatic reports, using override email " + options[:override_email]
          UserReport.send_report(email, recipient: options[:override_email], simulate_timestamp: options[:timestamp])
        else
          puts "Sending automatic reports"
          UserReport.send_report(email, simulate_timestamp: options[:timestamp])
        end
      end
    else # If a specific user was specified
      if options[:override_email]
        puts "Sending nag email to specific user with override email"
        UserReport.send_report(options[:user], begin_date: options[:bdate], end_date: options[:edate], recipient: options[:override_email], simulate_timestamp: options[:timestamp])
      else
        puts "Sending nag email to specific user"
        UserReport.send_report(options[:user], begin_date: options[:bdate], end_date: options[:edate], simulate_timestamp: options[:timestamp])
      end
    end
    exit
  end
end
