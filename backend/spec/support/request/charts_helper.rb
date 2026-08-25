module ChartsHelper

  def create_proper_chart
    FactoryBot.create(:duration_kind, code: 'billable_standard') unless DurationKind.where(code: 'billable_standard').count == 1
    FactoryBot.create(:work_chart, id: 1) if WorkChart.where(id: 1).count == 0
    # The explicit id:1 above doesn't advance work_chart_id_seq (it has no
    # OWNED BY, so TRUNCATE RESTART IDENTITY can't reset it either), so on a
    # fresh DB the next sequence-based create would collide on id=1.
    reset_id_sequences([WorkChart])
    FactoryBot.create :work_chart, parent_id: 1
  end

  def new_chart_params

    {
      work_chart: {
        display_label: 'Some new client . com',
        branch_order:  0,
        status:  'active',
        parent_id:  WorkChart.last
      }
    }
  end

  def setup_basic_charts
    insert_basic_charts
    @clients, @acme, @acme_general, @acme_ios, @acme_ios_devel, @acme_ios_design, @acme_rust, @acme_rust_devel =
      WorkChart.where("id >= 2").order("id asc").to_a
    @administration_project = FactoryBot.create :work_chart, :parent => @clients, :display_label => 'Administration'
  end

end
