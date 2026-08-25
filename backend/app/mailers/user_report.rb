class UserReport < ActionMailer::Base
  include ActionView::Helpers::NumberHelper
  default from: "EP Time Sheet <#{MAILER_FROM_EMAIL}>"

  def daily_email(email, options = {})
    @options = options.reverse_merge!(recipient: "", begin_date: nil, end_date: nil, simulate_timestamp: nil ) #get options with defaults

    @begin_date = @options[:begin_date] if @options[:begin_date] && !@options[:simulate_timestamp]
    @end_date = @options[:end_date] if @options[:end_date] && !@options[:simulate_timestamp]
    @send_mail = @options[:send_mail] if @options[:send_mail]
    @user = User.find_by_email(email)
    @name = @user[:name]
    @first_name = @user[:name].try(:split, /\s/).try(:first)

    if @user.team_managers
      @nag_recipients = (@user.team_managers.map(&:email) + @user.get_team_nag_email_recipients).uniq.join(', ')
    else
      @nag_recipients = ""
    end
    return if @first_name.nil?

    if @options[:simulate_timestamp]
      now = Time.zone.parse(@options[:simulate_timestamp])
    else
      now = Time.zone.now
    end

    yesterday = now - 1.day
    #Tues - Fri
    if !["Fri", "Sat", "Sun"].include? yesterday.strftime("%a")
      @begin_date ||= now - 1.day
      @end_date ||= now - 1.day
    #Sat
    elsif yesterday.strftime("%a") == "Fri"
      @begin_date ||= now - 1.day
      @end_date ||= now + 2.days
    #Sun
    elsif yesterday.strftime("%a") == "Sat"
      @begin_date ||= now - 2.days
      @end_date ||= now + 1.day
    #Mon
    else
      @begin_date ||= now - 3.days
      @end_date ||= now - 1.day
    end
    entries = WorkEntry.where(role_id: @user.role_id).
      where("date_performed >= :date", date: @begin_date.to_datetime.to_date).
      where("date_performed <= :date", date: @end_date.to_datetime.to_date)
    entries_duration = entries.joins(:work_entry_durations)
    if entries_duration.count > 0 
      day_total = Interval.new(entries_duration.sum(:duration))
    else
      day_total = Interval.new(0)
    end
    entries = entries.sort_by { |item| [item.work_chart_label_parts]} 
    @mentries = []
    entries.each do |entry|
      mentry = {}
      crumb = []
      node = entry.work_chart
      crumb.push(node.display_label)
      # parent_id = 1 is the Artificial Top node we want to skip
      while  node.parent_id && node.parent_id != 1 do
        parent = WorkChart.find(node.parent_id)
        crumb.push(parent.display_label)
        node = parent
      end
      crumb.delete_at(-1) # Remove End Point Corp from beginning
      mentry[:wc_crumb] = crumb.reverse.join(' - ')
      mentry[:durations] = []
      mentry[:time_total] = []
      mentry[:fee] = []
      entry.work_entry_durations.each do |duration|
        interval = Interval.new(duration.duration)
        mentry[:durations].push duration
        mentry[:time_total].push "#{interval.clock_hours}h #{interval.clock_minutes}m"
      end
      mentry[:fee] = []
      mentry[:fee].push entry.work_entry_fees.first.fee unless entry.work_entry_fees.first.nil?
      mentry[:descriptions] = []
      mentry[:descriptions].push "#{entry.description}"
      @mentries.push mentry
    end
    sending_to = options[:recipient] == "" ? @user.email : options[:recipient]
    if (day_total.clock_hours + day_total.clock_minutes.to_f/60).to_f > 0
      total = day_total.clock_hours + day_total.clock_minutes.to_f/60
      total = number_with_precision(total, precision: 2)
      @daily_total = "#{total} hours"

      mail(
        to: sending_to,
        reply_to: "#{@user[:name]} <#{@user.email}>",
        subject: "#{@first_name}, thanks for promptly submitting your time sheet! (#{total})",
        cc: "#{@nag_recipients }",
        bcc: MAILER_USER_REPORT_FILLED_BCC_RECIPIENTS,
	headers: {
	  'Precedence' => 'list',
	  return_path: '<>'
        }
      )
    else

      mail(
        to: sending_to,
        reply_to: "#{@user[:name]} <#{@user.email}>",
        subject: "#{@first_name}, did you forget to fill out your time sheet yesterday?",
        cc: "#{@nag_recipients}",
        bcc: MAILER_USER_REPORT_EMPTY_BCC_RECIPIENTS,
	headers: {
	  'Precedence' => 'list',
	  return_path: '<>'
        }
     )
    end
  end

  def self.send_report(email, options = {})
    UserReport.daily_email(email, options).deliver_now
  end
end
