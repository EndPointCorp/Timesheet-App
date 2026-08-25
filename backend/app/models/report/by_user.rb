class Report::ByUser < Report

  def self.build(items, params)
    if params[:fragmentation] != 'continuous'
      groups = self.split_items_by_periods(items, params[:fragmentation])

      groups.map do |key, group|
        groups[key] = self.build_user_tree(group)
      end

      groups
    else
      self.build_user_tree(items)
    end
  end

  def self.build_user_tree(items)
    items.group_by(&:role_id).map do |role_id, role_items|
      user = User.find_by_role_id(role_id)
      trees = self.build_trees(role_items)
      {
        name: user.name,
        children: trees,
        total: trees.inject(Interval.new(0)) { |sum, i| sum += Interval.new(i[:total]); sum },
        fee: trees.inject(0) { |sum, i| sum += i[:fee] || 0; sum }
      }
    end
  end

end
