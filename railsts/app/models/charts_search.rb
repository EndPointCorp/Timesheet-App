class ChartsSearch < ActiveRecord::Base
  self.table_name = :charts_search_specs
  self.primary_key = :id

  def self.with_phrase(phrase)
    query = phrase.gsub(/[^\w\s]/, " ").
      split(/\s/).
      each(&:strip).
      reject(&:empty?).
      map do |token|
        "#{token}:*"
    end.join " & "
    where("search_spec @@ to_tsquery('#{query}')").
      order("ts_rank(search_spec, to_tsquery('#{query}')) desc, labels asc")
  end

  def self.without_dead
    where.not(tree_status: 'dead')
  end

  def self.without_hidden
    where.not(tree_status: 'hidden')
  end

  def self.only_leafs
    where(child_ids: nil)
  end
end
