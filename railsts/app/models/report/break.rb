class Report::Break < Report

  def self.build(items, params)
    if params[:fragmentation] != 'continuous'
      groups = self.split_items_by_periods(items, params[:fragmentation])

      groups.map do |key, group|
        groups[key] = self.build_trees(group)
      end

      groups
    else
      self.build_trees(items)
    end
  end

end
