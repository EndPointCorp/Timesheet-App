module EntriesHelper

  def create_basic_entries_setup
    FactoryGirl.create(:production_category)
    FactoryGirl.create(:duration_kind)
    FactoryGirl.create(:duration_kind, code: 'billable_standard', display_label: "Billable: Standard", abbr_label: "BS")
    FactoryGirl.create(:work_entry_status)
    FactoryGirl.create(:work_chart_status, status: 'active')
    root = FactoryGirl.create(:work_chart, id: 1)
    FactoryGirl.create_list(:work_chart, 2, parent_id: root.id)
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

