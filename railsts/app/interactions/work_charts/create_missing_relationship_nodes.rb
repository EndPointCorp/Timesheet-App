class WorkCharts::CreateMissingRelationshipNodes < ActiveInteraction::Base
  def execute
    WorkChart.transaction do
      nonbillable_relationship = compose(WorkCharts::EnsureDurationKindExists, display_label: 'Non-Billable: Relationship',
              code: 'nonbillable_relationship', abbr_label: 'NBR')
      client_rel_node = compose(WorkCharts::EnsureNodeExists, parent: root_node, display_label: "Client Relationship")
      general = compose(WorkCharts::EnsureNodeExists, parent: client_rel_node, display_label: "General")
      active_clients.each do |client|
        compose(WorkCharts::CreateMissingRelationshipNode, work_chart: client, parent: client_rel_node)
      end
      compose(WorkEntries::MoveEntriesToNode, from: mining_node, to: general)
      compose(WorkEntries::MoveEntriesToNode, from: manag_node, to: general)
      compose(WorkCharts::SetNodeKindSet, work_chart: client_rel_node, default_kind: nonbillable_relationship)
      compose(WorkEntries::SetNodeEntriesDurationKind, work_chart: general, duration_kind: nonbillable_relationship)
      mining_node.update_attributes!(status: 'dead')
      manag_node.update_attributes!(status: 'dead')
    end
  end

  def active_clients
    @_active_clients ||= WorkChart.where( 
      parent_id: WorkChart.select(:id).where(display_label: 'Clients'),
      status: 'active') 
  end

  def mining_node
    @_mining_node ||= WorkChart.where(display_label: 'Client Mining', parent_id: 2).first
  end

  def manag_node
    @_manag_node ||= WorkChart.where(display_label: 'Client Management', parent_id: 2).first
  end

  def root_node
    @_root_node ||= WorkChart.where(parent_id: 1).first
  end
end
