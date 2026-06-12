# pseudo model for fetching report items
class Report

  def self.build(items)
    raise 'undefined'
  end

  def self.by_params(params)
    from = params[:start_date].is_a?(Date) ? params[:start_date] : DateTime.parse(params[:start_date])
    to = params[:end_date].is_a?(Date) ? params[:end_date] : DateTime.parse(params[:end_date])

    if params[:roles] === [""] || params[:roles] === []
      role_ids  = User.select(:role_id).map(&:role_id)
    else
      role_ids  = User.where(email: params[:roles]).select(:role_id).map(&:role_id)
    end

    root_id = if params[:option] == 'all' || params[:work_chart_id].nil?
                2
              else
                params[:work_chart_id].to_i
              end

    columns = self.columns
    if params[:description] == 'false' || params[:description] == false
      columns = columns.reject { |c| c == :description }
    end
    items = ReportItem.select(columns)
    items = items.where(['date_performed >= DATE(?) AND date_performed <= DATE(?)', from, to])
    items = items.where(['? = any(path)', root_id])
    if params[:full_rights] == true
      items = items.where(role_id: (role_ids)) if !role_ids.empty?
      restricted_names = []
    else
      reportable_ids = params[:user].reportable_users.map(&:role_id)
      diff_ids = role_ids - reportable_ids
      actual_role_ids = items.select(:role_id).map(&:role_id)
      items = items.where(role_id: (role_ids - diff_ids))
      restricted_names = User.select("username").where({role_id: (diff_ids & actual_role_ids)}).map(&:username).map(&:camelize).sort
    end
    result = self.build(items, params)

    Document.new result, restricted_names, self, params
  end

  def self.process_labels(trees, item)
    labels = item.labels.map { |l| l.gsub(/["]/, '') }
    building_tree(labels, trees, item)
  end

  def self.columns
    [ :id, :description, :date_performed, :role_id, :path, :labels,
      :total_fee, :duration_kind_codes, :duration_values, :fullname, :approved ]
  end

  def self.build_trees(items)
    result_trees = items.inject([]) do |trees, item|
      self.process_labels(trees, item)
      trees
    end
    result_trees
  end

  def self.extract_item(current_item, kind_code)
      duration_values_array = current_item.duration_values
      if duration_values_array.count > 1
        duration_kind_codes_array = current_item.duration_kind_codes
        index = duration_kind_codes_array.index(kind_code)
        duration_value = duration_values_array[index]
        current_item.duration_values = "{#{duration_value}}"
        current_item.duration_kind_codes = "{#{kind_code}}"
      end
      current_item
  end

  def self.building_tree(labels, trees, item)
      labels.count.times do |i|
        tree_item = get_tree_item(trees, labels[0..i])
        tree_item[:name] ||= labels.last
        tree_item[:children] ||= []
        tree_item[:total] ||= Interval.new(0)
        tree_item[:total] += item.duration_values.inject(Interval.new(0)) do |s, j|
          s += Interval.new(j)
        end
        tree_item[item.duration_kind_codes.first.to_sym] ||= Interval.new(0)
        tree_item[item.duration_kind_codes.first.to_sym] += item.duration_values.inject(Interval.new(0)) do |s, j|
          s += Interval.new(j)
        end
        tree_item[:fee] ||= 0
        tree_item[:fee] += item.total_fee || 0
        tree_item[:approved] = item.approved
        if item.attributes.keys.include? 'description'
          tree_item[:description] ||= ''
          child_item = {}
          child_item[:name] ||= item.date_performed.to_s+" ("+item.date_performed.strftime("%A")+")"
          child_item[:children] ||= []
          child_item[:total] ||= Interval.new(0)
          child_item[:total]  = item.duration_values.inject(Interval.new(0)) do |s, j|
            s += Interval.new(j)
          end
          child_item[:fee] = item.total_fee || 0
          child_item[:fullname] ||= item.fullname
          child_item[:approved] = item.approved
          child_item[:date] = item.date_performed.to_s
            child_item[:description] = item.description
          if labels.last == labels[i]
            tree_item[:children] << child_item
          end
        end
      end
  end

  def self.get_tree_item(trees, labels)
    wtrees = trees
    labels.each do |label|
      # get item for current level
      tree = wtrees.find { |t| t[:name] == label }
      if tree.nil?
        # if it doesn't exist - create it and append
        tree = {name: label, children: []}
        wtrees << tree
      end
      if label == labels.last
        return tree
      end
      # change working_tree to children of current level item
      wtrees = tree[:children]
    end
  end

  def self.split_items_by_periods(items, type)
    new_items = {}

    if type == 'weekly'
      new_items = items.group_by {|x| [x[:date_performed].to_time.strftime('%W').to_i + 1, x[:date_performed].to_time.year]}
      new_items = (new_items.sort_by {|k, v| (k[1].to_s + k[0].to_s).to_i}).to_h
    elsif type == 'monthly'
      new_items = items.group_by {|x| [x[:date_performed].to_time.month, x[:date_performed].to_time.year]}
      new_items = (new_items.sort_by {|k, v| Date.parse(k[0].to_s + '-' + k[1].to_s + '-1')}).to_h
    elsif type == 'quarterly'
      new_items = items.group_by {|x| [(Date.parse(x[:date_performed].to_s).month / 3.0).ceil.to_i, x[:date_performed].to_time.year]}
      new_items = (new_items.sort_by {|k, v| (k[1].to_s + k[0].to_s).to_i}).to_h
    elsif type == 'yearly'
      new_items = items.group_by {|x| [x[:date_performed].to_time.year]}
      new_items = (new_items.sort_by {|k, v| Date.parse("#{k[0]}-01-01")}).to_h
    else
      items
    end
  end

  class Document
    attr_accessor :all_items, :items, :restricted_users, :period_type, :total_time,
      :total_fee, :billable_time, :total_total_time, :total_total_fee,
      :billable_details, :nonbillable_details, :nonbillable_time, :report, :params,
      :view, :missed_users, :non_billable_time, :budgets

    def initialize(result, restricted_names, report, params)
      @report = report
      @params = params
      @items = result
      @restricted_users = @missed_users = restricted_names
      @view = 'report_periods'
      if params[:show_hours_in_the_bank] == 'true'
        ids = ChartLabel.where("? = any(ids)", params[:work_chart_id]).select(:id).map(&:id)
        @budgets = HoursInTheBank::Budget.where("work_chart_id = any(array[?]::int[])", ids).
                    joins(:chart_label).
                    order('labels asc')
      end
      set_meta
    end

    def set_meta
      case report.name
      when "Report::Billing" then set_billing_meta
      when "Report::Standard" then set_standard_meta
      when "Report::ByUser" then set_by_user_meta
      when "Report::Break" then set_break_meta
      when "Report::BillingAtLeaf" then set_billing_at_leaf_meta
      end
    end

    def params
      @params
    end

    def set_billing_meta
      if params[:fragmentation] && params[:fragmentation] != '' && params[:fragmentation] != 'continuous'
        @all_items = [@items, @restricted_users]

        @all_items[0].map do |k, e|
          @all_items[0][k] = process_report(e, 0, [])
        end

        @period_type = params[:fragmentation]
        set_total_time_and_fee_periods
        set_billable_time_periods
      else
        @items = sort_report(@items)
        @all_items = [process_report(@items, 0, []), @restricted_users]

        set_total_time_and_fee
        set_billable_time
        @view = :report
      end
    end

    def set_standard_meta
      if params[:fragmentation] && params[:fragmentation] != '' && params[:fragmentation] != 'continuous'
        @all_items = [@items, @restricted_users]
        @period_type = params[:fragmentation]
        set_total_time_and_fee_periods
      else
        @items = @items.sort_by{|item| [ item[:date], (!item[:fullname].nil?)? item[:fullname].downcase : "(item[:fullname] || '')",
        (!item[:name].nil?)? item[:name].downcase : "(item[:name] || '')"] }
        @all_items = [@items, @restricted_users]
        @view = 'report'
        set_total_time_and_fee
      end
    end

    def set_by_user_meta
      if params[:fragmentation] && params[:fragmentation] != '' && params[:fragmentation] != 'continuous'
        @all_items = [@items, @restricted_users]
        @all_items[0].map do |k, e|
          @all_items[0][k] = process_report(e, 0, [])
        end
        @period_type = params[:fragmentation]
        set_total_time_and_fee_periods
      else
        @view = 'report'
        @items = sort_report(@items)
        @all_items = [process_report(@items, 0, []), @restricted_users]
        set_total_time_and_fee
      end
    end

    def set_break_meta
      if params[:fragmentation] && params[:fragmentation] != '' && params[:fragmentation] != 'continuous'
        @all_items = [@items, @restricted_users]
        @all_items[0].map do |k, e|
          @all_items[0][k] = process_report(e, 0, [])
        end
        @period_type = params[:fragmentation]
        set_total_time_and_fee_periods
      else
        @items = sort_report(@items)
        @all_items = [process_report(@items, 0, []), @restricted_users]
        @view = 'report'
        set_total_time_and_fee
      end
    end

    def set_billing_at_leaf_meta
      if params[:fragmentation] && params[:fragmentation] != '' && params[:fragmentation] != 'continuous'
        @all_items = [@items, @restricted_users]
        @all_items[0].map do |k, e|
          @all_items[0][k] = process_report(e, 0, [])
        end
        @period_type = params[:fragmentation]
        set_total_time_and_fee_periods
      else
        @items = sort_report(@items)
        @all_items = [process_report(@items, 0, []), @restricted_users]
        set_total_time_and_fee
        @view = 'report'
      end
    end

    def set_total_time_and_fee
      @total_time = @total_total_time = Interval.new
      @total_fee = 0
      @missed_users = @all_items.second

      items =
        if @report.name == 'Report::Standard'
          @all_items.first
        else
          @all_items.first.select { |item| item[:name] == 'End Point Corp.' }
        end

      items.each do |item|
        @total_time += Interval.new(item[:total])
        @total_fee += (item[:fee] || 0)
      end
    end

    def set_total_time_and_fee_periods
      @total_time = {}
      @total_fee = {}
      @total_total_time = Interval.new
      @total_total_fee = 0
      @missed_users = @all_items.second

      items = @all_items.first

      items.each do |k, item|
        total_time_group = Interval.new
        total_fee_group = 0

        item.each do |subitem|
          if subitem[:level] == 0
            total_time_group += Interval.new(subitem[:total])
            total_fee_group += (subitem[:fee] || 0)
          end
        end

        @total_time[k] = total_time_group
        @total_fee[k] = total_fee_group
        @total_total_time += total_time_group
        @total_total_fee += total_fee_group
      end
    end

    def set_billable_time_periods
      subitems = []

      items.each do |k, item|
        item.each do |subitem|
          subitems.push(subitem)
        end
      end

      get_duration_details_periods(subitems)
      @billable_time = Interval.new(subitems.select { |item| item[:name] == 'Billable' }.sum(Interval.new) { |item| Interval.new(item[:total]) })
      @non_billable_time = @total_total_time - @billable_time
    end

    def get_duration_details
      @billable_details = []
      @nonbillable_details = []

      durations = @all_items.first.map {|item| item.fetch(:name)}.uniq.grep(/Billable/i)
      #Billable and non-billable totals are displayed by default, remove the duplicate here
      durations = durations.reject {|duration| duration == "Billable" || duration == "Non-billable"}
      nonbillable =  durations.grep(/non/i)
      billable = durations - nonbillable
      billable.each do |duration|
        @billable_details << [duration, @all_items.first.select { |item| item[:name] == duration}.sum(Interval.new) { |item| Interval.new(item[:total]) }]
      end
      nonbillable.each do |duration|
        @nonbillable_details << [duration, @all_items.first.select { |item| item[:name] == duration}.sum(Interval.new) { |item| Interval.new(item[:total]) }]
      end
    end

    def get_duration_details_periods(subitems)
      @billable_details = []
      @nonbillable_details = []

      durations = subitems.map {|item| item.fetch(:name)}.uniq.grep(/Billable/i)
      #Billable and non-billable totals are displayed by default, remove the duplicate here
      durations = durations.reject {|duration| duration == "Billable" || duration == "Non-billable"}
      nonbillable =  durations.grep(/non/i)
      billable = durations - nonbillable
      billable.each do |duration|
        @billable_details << [duration, subitems.select { |item| item[:name] == duration}.sum(Interval.new) { |item| Interval.new(item[:total]) }]
      end
      nonbillable.each do |duration|
        @nonbillable_details << [duration, subitems.select { |item| item[:name] == duration}.sum(Interval.new) { |item| Interval.new(item[:total]) }]
      end
    end

    def set_billable_time
      get_duration_details
      @billable_time = Interval.new(@all_items.first.select { |item| item[:name] == 'Billable' }.sum(Interval.new) { |item| Interval.new(item[:total]) })
      @non_billable_time = @total_time - @billable_time
    end

    def sort_report(items)
      items = items.sort_by{ |item|
        [(!item[:name].nil?)? item[:name].downcase : "(item[:name] || '')" , item[:date],
          (!item[:fullname].nil?)? item[:fullname].downcase : "(item[:fullname] || '')"]
      }
      items.each{ |item| item[:children] = sort_report(item[:children]) if item[:children].size > 0 }
      items
    end

    def process_report(report_data, level, formatted_data)
      report_data.each do |report|
        report[:level] = level
        if report[:children].length >0
          children = report[:children]
          report.delete(:children)
          formatted_data << report
          formatted_data = process_report(children, level+1, formatted_data)
        else
          report.delete(:children)
          formatted_data << report
        end
      end
      formatted_data.flatten
    end
  end
end
