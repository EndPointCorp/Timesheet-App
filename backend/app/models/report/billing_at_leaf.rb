class Report::BillingAtLeaf < Report

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

  def self.process_labels(trees, item)
    labels = item.labels.map { |l| l.gsub(/["]/, '') }
    billing_labels = item.duration_kind_codes
    if billing_labels.count > 1
      billing_labels.count.times do |l|
        new_labels = Marshal.load(Marshal.dump(labels))
        new_item = Marshal.load(Marshal.dump(item))
        current_item = self.extract_item(new_item, billing_labels[l])
        new_labels << (DurationKind.find_by_code billing_labels[l]).display_label
        building_tree(new_labels, trees, current_item)
      end
    else
      labels << (DurationKind.find_by_code billing_labels[0]).display_label
      building_tree(labels, trees, item)
    end
  end
end
