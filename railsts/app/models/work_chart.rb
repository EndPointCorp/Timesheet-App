class WorkChart < ActiveRecord::Base
  self.table_name = :work_chart

  has_many :work_chart_kind_sets
  has_many :work_chart_kinds
  has_many :work_entries
  has_many :work_chart_kinds_defaults
  has_many :children, class_name: "WorkChart", foreign_key: :parent_id
  has_many :transactions, foreign_key: 'work_chart_id'
  belongs_to :parent, class_name: "WorkChart", foreign_key: :parent_id
  belongs_to :work_chart_status, foreign_key: :status, primary_key: :status

  after_commit :log_commit, on: :update

  # Temporary logging function to see if work charts are being updated at weird times
  def log_commit
    Rails.logger.info "Updated work chart #{self.id}. New values: #{self}"
  end

  # TODO: get rid of it once the frequent_for is refactored
  attr_accessor :labels

  def self.project_managed
    joins("INNER JOIN managed_work_charts on managed_work_charts.id = work_chart.id").
      select("work_chart.*")
  end

  def self.active
    where(status: "active")
  end

  def client_rep
    Role.joins(rights: [ :right_type, :targets]).
      where(rights: { right_types: { code: 'represent'}}).
      where("targets.ref_obj_pk IN (:ids)", ids: self.up_path_ids).first.try(:user)
  end

  def project_managers
    User.joins(role: { rights: [ :right_type, :targets ]}).
      where(right_types: { code: 'project_manage'}).
      where("right_targets.ref_obj_pk in (:ids)", ids: self.up_path_ids.map(&:to_s)).
      distinct
  end

  def clear_rep
    return unless self.client_rep

    rep = Right.joins([ :right_type, :targets ]).
              where(role_id: self.client_rep.role_id).
              where(right_types: { code: 'represent'}).
              where(targets: { ref_obj_pk: self.id.to_s}).first
    return unless rep
    target = rep.targets.select { |t| t.ref_obj_pk == self.id.to_s }.first
    target.destroy
  end

  # Base scope including labels from joined SQL view
  def self.with_labels
    WorkChart.joins('INNER JOIN chart_labels ON chart_labels.id = work_chart.id').
      select('work_chart.*, chart_labels.labels, chart_labels.tree_status')
  end

  def self.by_name(name)
    where(display_label: name)
  end

  def self.clients
    WorkChart.by_name("Clients").first
  end

  def self.client_by_name(name)
    where(parent_id: WorkChart.clients.id).
    where(display_label: name).first
  end

  # TODO: refactor to use chart_labels to rely totally on labels and ordering
  # in database
  def self.quicks_for(user)
    raise ArgumentError if user.class != User

    columns = %q(chart_labels.id,
      chart_labels.labels,
      chart_labels.ids,
      chart_labels.ids[array_length(ids, 1) - 1] as parent_id,
      tree_status)

    recents = ChartLabel.joins(:work_entries).
      where(work_entries: { role_id: user.role_id }).
      where("date_performed > :date", date: 3.months.ago).
      where(tree_status: 'active').
      select(columns + ", 1 as entry_count")
      distinct.
      limit(15)

    frequents = ChartLabel.joins(:work_entries).
      where(work_entries: { role_id: user.role_id }).
      where("date_performed > :date", date: 3.months.ago).
      where(tree_status: 'active').
      select(columns + ", count(work_entries.*) as entry_count").
      distinct.
      limit(15).
      order("entry_count desc").
      group("chart_labels.id, chart_labels.labels,chart_labels.ids, chart_labels.tree_status")

    recents.union(frequents).select(columns).distinct.order(:labels)
  end

  def self.able_to_be_parents
    joins('INNER JOIN chart_labels ON chart_labels.id = work_chart.id').
      joins('LEFT OUTER JOIN work_entries ON work_entries.work_chart_id = work_chart.id').
      where('work_entries.work_chart_id is null').select('work_chart.id, display_label, parent_id, status, labels')
  end

  def self.leafs_with_labels
    ids = WorkChart.select('DISTINCT parent_id').map(&:parent_id).reject(&:nil?)
    WorkChart.with_labels.where(['work_chart.id not in (?)', ids])
  end

  def up_path_ids(tail = [])
    ChartLabel.
      where(id: self.id).
      first.ids.take_while { |i| i != self.id } << self.id
  end

  def down_path_ids(tail = [])
    ChartLabel.
      where(id: self.id).
      first.ids.reverse.take_while { |i| i != self.id }
  end

  def defaults_on_tree
    @defaults_on_tree ||= Proc.new do
      if self.work_chart_kinds_defaults.empty?
        defaults = self.default_kinds
        WorkChartKind.where kind_code: defaults
      else
        self.work_chart_kinds_defaults
      end
    end.call
  end

  def duration_kinds
    if @duration_kinds
      @duration_kinds
    else
     if self.has_customized_set?
       @duration_kinds = DurationKind.joins('INNER JOIN work_chart_kinds ON work_chart_kinds.kind_code = code').
         where(['work_chart_kinds.work_chart_id = ?', self.id])
       defaults = self.default_kinds
       @duration_kinds = @duration_kinds.sort {|k| defaults.include?(k.code) ? -1 : 1 }
     else
       self.parent.duration_kinds
     end
    end
  end

  def has_customized_set?
    !self.work_chart_kind_sets.empty?
  end

  def inherited_from_id
    WorkChart.joins(:work_chart_kind_sets).
      where("work_chart_kind_sets.work_chart_id in (:ids)", ids: self.up_path_ids).
      select(:id).last.id
  end

  def default_kinds
    # let's see if current chart has default durations
    defaults = self.work_chart_kinds_defaults.select(:kind_code).map(&:kind_code)
    if defaults.any?
      defaults
    elsif parent
      parent.default_kinds
    else
      []
    end
  end

  def self.recent_for(user, limit)
    recent_sql = <<-eos
        SELECT work_chart_id, MAX(date_performed) AS last_date
        FROM work_entries
        WHERE
          role_id = #{user.role_id} AND
          date_performed > DATE('#{3.months.ago.to_fs(:db)}')
        GROUP BY work_chart_id
        ORDER BY last_date DESC
        LIMIT #{limit};
    eos
    labels_sql = <<-sql
      WITH RECURSIVE tree AS
        (SELECT display_label,
                id,
                parent_id,
                status,
                NULL::varchar AS parent_name,
                display_label::text AS path
        FROM work_chart
        WHERE parent_id IS NULL
        UNION SELECT f1.display_label,
                      f1.id,
                      f1.parent_id,
                      f1.status,
                      tree.display_label AS parent_name,
                      tree.path || '-' || f1.display_label::text AS path
        FROM tree
        JOIN work_chart f1 ON f1.parent_id = tree.id)
      SELECT id,
            parent_id,
            status,
            path
      FROM tree
      WHERE
        id in (?) AND
        status = 'active'
    sql

    ids = WorkChart.find_by_sql(recent_sql).map(&:work_chart_id)
    WorkChart.find_by_sql([labels_sql, ids]).map {|c| c.labels = c["path"].split(/(?<! )-(?! )/)[2..100]; c}
  end

  def labels
    @labels ||= self["labels"]
    unless @labels
      @labels = WorkChart.with_labels.where(id: self.id).first.labels
    end
    if @labels.class.to_s == "String"
      @labels = @labels.gsub(/[\{\}]/, '').split(',').map {|l| l.gsub(/[\"]/, '')}
    end
    @labels
  end

  def activate!
    @workcharts = WorkChart.where(id: self.id)
    @workcharts.each do |a|
      if a.status != "active"
        a.status = "active"
        a.save!
      end
    end
  end

  # TODO: remove once quicks are refactored
  def get_sorter(a)
    WorkChart.get_sorter(a)
  end

  def self.get_sorter(a)
    return [] if a.nil?
    labels = a.kind_of?(Hash) ? a["labels"] : a.labels
    labels.join.split(/((?:(?:^|\s)[-])?(?:\.\d|\d+(?:\.\d+?(?:[eE]\d+)?(?:$|(?![eE\.])))?))/m).map {|v| Float(v) rescue v.downcase}
  end

  class ProjectManaged < ActiveRecord::Base
    self.table_name = :managed_work_charts
  end
end
