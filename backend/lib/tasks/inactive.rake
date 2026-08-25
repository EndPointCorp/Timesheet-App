# Usage: rake inactive:hide_inactive_worksheets -- [options]
# For help: rake inactive:hide_inactive_worksheets -- --help
require 'optparse'
require 'date'

namespace :inactive do
  desc "Hides inactive workcharts"
  task hide_inactive_worksheets: :environment do |t, args|
    @options = { top_node: 2 } # Default top node is 2

    opt_parser = OptionParser.new do |opts|
      opts.banner = "Usage: rake inactive:hide_inactive_worksheets -- [options]"

      opts.on("--date=YYYY-MM-DD", "") do |date|
        @options[:date] = Date.strptime(date, '%Y-%m-%d') or raise "Date must be in YYYY-MM-DD format"
      end

      opts.on("--days=I", Integer, "") do |days|
        @options[:days] = (Date.today - days) or raise "Date could not be calculated from days"
      end

      opts.on("--top-node=I", Integer, "Top node to crawl") do |top_node|
        @options[:top_node] = top_node
      end

      opts.on("--dry-run", "See what changes will be made without applying them") do |dry_run|
        @options[:dry_run] = dry_run
      end

      opts.on("--exclude=x,y,z...", Array, "List of node IDs to exclude from changes") do |excluded|
        @options[:excluded] = excluded
      end

      opts.on("--inactive-general", "Include chart named 'General' if it has an active relative") do |inactive_general|
        @options[:inactive_general] = inactive_general
      end

      opts.on("-h", "--help", "Prints this help") do
        puts opts
        exit
      end
    end

    # Hack to make option parser work with rake as rake doesn't follow semantic versioning
    # and introduces breaking changes (sigh)

    ARGV.shift
    ARGV.shift

    args = opt_parser.order!(ARGV)
    opt_parser.parse!(args)

    if @options[:days].nil? && @options[:date].nil? or !@options[:days].nil? && !@options[:date].nil?
      raise "Please specify exactly one of a date (via --date='...') or a number of days (via --days=N).\n"
    elsif @options[:days]
      @date = @options[:days]
    else
      @date = @options[:date]
    end

    puts "======== Running for top node #{@options[:top_node]} for date limit #{@options[:date]} ========"

    #ActiveRecord::Base.establish_connection()
    connection = ActiveRecord::Base.connection
    connection.transaction do
      connection.execute('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE')
      db = connection.raw_connection

      if @options[:inactive_general]
        not_being_used = "not (work_chart.id = any(actives.ids)) AS not_being_used"
      else
        not_being_used = %{
          CASE WHEN work_chart.display_label = 'General'
            THEN not (array[work_chart.id, work_chart.parent_id] && actives.ids) 
            ELSE not (work_chart.id = any(actives.ids)) 
          END AS not_being_used
        }
      end
          
      @results = db.exec_params(%{
        SELECT 
          chart_labels.id,
          array_to_string(chart_labels.ids, ',') AS ids,
          array_to_string(
            array_remove(chart_labels.labels, 'End Point Corp.'), ' → ') AS labels
        FROM chart_labels
        JOIN (
          SELECT 
            work_chart.id,
            work_chart.status,
            #{ not_being_used }
          FROM work_chart
          JOIN (
            SELECT array_agg(actives.work_chart_id) AS ids
            FROM (
              SELECT DISTINCT unnest(chart_labels.ids) AS work_chart_id
              FROM work_entries
              INNER JOIN chart_labels 
                      ON chart_labels.id = work_entries.work_chart_id
              WHERE
                work_entries.date_performed >= $1::DATE
            ) actives
          ) actives ON true
          WHERE work_chart.date_created <= now() - interval '1 year'
          GROUP BY work_chart.id, work_chart.status, actives.ids
        ) stats ON stats.id = chart_labels.id
        WHERE
          chart_labels.tree_status = 'active' AND
          stats.not_being_used IS true AND
          $2 = any(chart_labels.ids);
      }, [@date.strftime('%Y-%m-%d'), @options[:top_node]])

      if @options[:excluded]
        @results = @results.select do |r|
          not @options[:excluded].include? r["id"]
        end
      end

      @results = @results.to_a

      puts "======== List of nodes to hide:"
      @results.sort { |x,y| x["id"].to_i <=> y["id"].to_i }.each do |r|
        puts "#{r["labels"]} (##{r["id"]})"
      end
      puts "======== #{@results.count} total candidates"

      if @options[:dry_run]
        puts "======== Dry run requested; no action taken."
      elsif not @results.empty?
        puts "======== Preparing to update #{@results.count} candidates"
        WorkChart.where(id: @results.map { |r| r["id"] }).update_all(status: "hidden")
        WorkChart.regenerate_index 
      else
        puts "======== Skipping update; no candidates"
      end
    end
  end
end
