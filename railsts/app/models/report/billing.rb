class Report::Billing < Report

  def self.build(items, params)
    if params[:fragmentation] != 'continuous'
      groups = self.split_items_by_periods(items, params[:fragmentation])

      groups.map do |key, group|
        groups[key] = self.process_items(group)
      end

      groups
    else
      self.process_items(items)
    end
  end

  def self.process_items(items)
    billable_kinds = DurationKind.billable
    nonbillable_kinds = DurationKind.nonbillable
    trees = [
      {
        name: 'Billable',
        total: 0,
        children: billable_kinds.map do |kind|
          current_items = items.select { |i| i.kind_codes.include? kind.code }
          billable_items = Marshal.load( Marshal.dump(current_items))
          billalbe_items = self.extract_category(billable_items, kind.code)
          {
            name: kind.display_label,
            total: 0,
            children: self.build_trees(billable_items)
          }
        end
      },
      {
        name: 'Non-billable',
        total: 0,
        children: nonbillable_kinds.map do |kind|
          current_items = items.select { |i| i.kind_codes.include? kind.code }
          nonbillable_items = Marshal.load(Marshal.dump(current_items))
          nonbillable_items = self.extract_category(nonbillable_items, kind.code, zero_fee: true)
          {
            name: kind.display_label,
            total: 0,
            children: self.build_trees(nonbillable_items)
          }
        end
      }
    ] 
    trees.each do |tree|
      tree[:children].each do |subtree|
        subtree[:total] = subtree[:children].inject(Interval.new(0)) { |s, i| s += i[:total]; s }
        subtree[:fee] = subtree[:children].inject(0) { |s, i| s += i[:fee]; s }
      end
      tree[:children] = tree[:children].select { |c| c[:total] != Interval.new(0) || c[:fee] != BigDecimal.new('0.0') }
      tree[:total] = tree[:children].inject(Interval.new(0)) { |s, i| s += i[:total]; s }
      tree[:fee] = tree[:children].inject(0) { |s, i| s += i[:fee]; s }
    end
    trees.select { |t| t[:total] != Interval.new(0) }
  end  

  def self.without_columns
    []
  end

  # BUG fix: When a dual entry (e.g. 1h billable + 1h non-billable) has a
  # fixed fee ($90), process_items deep-copies the entry into both the billable
  # and non-billable trees. This method already splits duration_values and
  # duration_kind_codes per tree, but total_fee was left untouched — causing
  # the fee to be counted in both trees ($90 + $90 = $180 instead of $90).
  #
  # Options considered:
  #   A) Proportional split (fee * duration_ratio) — standard in cost accounting,
  #      but this is a billing report, not a cost report. Splitting creates
  #      dollar amounts ($45) that nobody entered and implies non-billable work
  #      has a client-facing fee, which is contradictory.
  #   B) Assign full fee to billable, zero on non-billable — fee represents what
  #      the client is charged, which is inherently a billable concept.
  #   C) Assign to first duration — arbitrary, unpredictable.
  #
  # Decision: Option B. The fee belongs in the billable tree because "fee" means
  # "what we bill the client." Non-billable work is internal overhead by definition.
  # The zero_fee flag is passed by the caller (the non-billable loop in
  # process_items) so this method stays agnostic of billing kind naming conventions.
  #
  # Scope: only triggers when dv_array.count > 1 (multi-duration entry being split)
  # AND zero_fee is true (non-billable context). Single-duration entries and
  # billable copies are unaffected.
  def self.extract_category(current_items, kind_code, zero_fee: false)
    current_items.count.times do |i|
      dv_array = current_items[i].duration_values
      if dv_array.count > 1
        dkc_array = dkc = current_items[i].duration_kind_codes
        index = dkc.index(kind_code)
        dv = dv_array[index]
        current_items[i].duration_values = "{#{dv}}"
        current_items[i].duration_kind_codes = "{#{kind_code}}"
        current_items[i].total_fee = 0 if zero_fee
      end
    end
    current_items
  end

end
