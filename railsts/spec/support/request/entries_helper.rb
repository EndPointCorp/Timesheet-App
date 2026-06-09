module EntriesHelper

  def create_basic_entries_setup
    FactoryBot.create(:production_category)
    FactoryBot.create(:duration_kind)
    FactoryBot.create(:duration_kind, code: 'billable_standard', display_label: "Billable: Standard", abbr_label: "BS")
    FactoryBot.create(:work_entry_status)
    FactoryBot.create(:work_chart_status, status: 'active')
    root = FactoryBot.create(:work_chart, id: 1)
    # Explicit id:1 doesn't advance work_chart_id_seq (no OWNED BY), so bump it
    # before the sequence-based creates below or they collide on id=1 on a fresh DB.
    reset_id_sequences([WorkChart])
    FactoryBot.create_list(:work_chart, 2, parent_id: root.id)
  end

  def destroy_entries_setup
    WorkEntry.destroy_all
    WorkChart.destroy_all
    WorkChartStatus.destroy_all
    WorkEntryStatus.destroy_all
    DurationKind.destroy_all
    ProductionCategory.destroy_all
  end

end

