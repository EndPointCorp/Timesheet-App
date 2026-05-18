class Report::Standard < Report

  def self.build(items, params)
    items = items.map do |item|
      i = {
        name: item.labels.map { |l| l.gsub(/\"/,'') }[1..-1].join(' - '),
        total: item.duration_values.inject(Interval.new(0)) { |s, i|
          s += Interval.new(i)
        },
        fee: item.total_fee,
        fullname: item.fullname,
        date: item.date_performed.to_s,
        date_performed: item.date_performed,
        approved: item.approved,
        level: 0
      }
      if item.attributes.keys.include? 'description'
        i[:description] = item.description if item.description
        i[:date] += " ("+item.date_performed.strftime("%A")+")"
      end
      i
    end

    if params[:fragmentation] != 'continuous'
      items = self.split_items_by_periods(items, params[:fragmentation])
    end

    items
  end

end
