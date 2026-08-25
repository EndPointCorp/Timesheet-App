class WorkChartsController < ApplicationController
  before_action :ensure_logged_in
  respond_to :json

  # Only allow crud operations on charts for users who have rights to do so
  # Refer to Role and Right models for further info
  before_action :ensure_can_edit_charts, only: [:update, :create, :destroy]

  # GET /work_charts/able_to_be_parents.json
  #
  # Used by charts editor. Returns all charts that could become a new parent for
  # a new chart
  def able_to_be_parents
    @charts = WorkChart.able_to_be_parents
  end

  # GET /work_charts.json
  def index
    if params[:include_paths]
      render json: WorkChart.all_with_paths
    else
      base = WorkChart.with_labels
      base = params[:include_inactive] ? base.where({}) : base.where(status: "active")
      base = base.where(parent_id: params[:parent_id]) if params[:parent_id]
      @charts = base.order(:display_label)
      respond_with @charts
    end
  end

  # GET /work_charts/:id.json
  def show
    @chart = WorkChart.find params[:id]
    respond_with @chart
  end

  # GET /work_charts/search.json?term=:term
  def search
    @results = ChartsSearch.with_phrase(params[:term])
    @results = @results.without_hidden if params[:include_hidden] != 'true'
    @results = @results.without_dead if params[:include_dead] != 'true'
    @results = @results.only_leafs if params[:include_nonleafs] != 'true'
  end

  # GET /work_charts/quicks.json
  #
  # Used by quick picks. It returns mixed list of most frequent and most recently used
  # charts in the last 3 months
  def quicks
    @charts = WorkChart.quicks_for(effective_user)
  end

  # GET /work_charts/:id/kinds.json
  #
  # Used by the charts editor. Returns kinds for work charts with info
  # about whether given kind was inherited or not
  #
  # It is also used by the entry form.
  def kinds
    chart = WorkChart.find(params[:id])
    @kinds = chart.duration_kinds
    @immediate = chart.work_chart_kinds
    @defaults = chart.defaults_on_tree
    @inherited_from_id = chart.inherited_from_id
    respond_with @kinds
  end
  
  # GET /work_charts/:id/assigned_work_entries_count.json
  #
  # Used by the charts editor. When the count is greater than 0, we cannot add a child
  # to given chart
  def assigned_work_entries_count
    render json: {count: WorkEntry.find_all_by_work_chart_id(params[:id]).count}.to_json
  end

  # GET /work_charts/:id/has_customized_set.json
  #
  # Used by the charts editor. It tells if given chart has customized kinds set
  def has_customized_set
    render json: WorkChart.find(params[:id]).has_customized_set?
  end

  def clients
    @charts = WorkChart.where(parent_id: WorkChart.clients.id).order("display_label ASC")
    respond_with @charts
  end

  # POST /work_charts.json
  def create
    create = WorkCharts::CreateWorkChart.run parent: WorkChart.find(params[:work_chart][:parent_id]),
      display_label: params[:work_chart][:display_label],
      user: effective_user
    if create.errors.empty?
      log_state create.result
      render json: { status: 'OK', chart: create.result }.to_json
    else
      render json: { status: 'ERROR', errors: create.errors.full_messages }.to_json
    end
  end
  
  # PUT /work_chart/:id.json
  def update
    work_chart = WorkChart.find params[:id]
    update = WorkCharts::UpdateWorkChart.run work_chart: work_chart,
      parent_id: params[:work_chart][:parent_id],
      display_label: params[:work_chart][:display_label],
      status: params[:work_chart][:status],
      dont_send_empty_reports: params[:work_chart][:dont_send_empty_reports]

    if update.errors.empty?
      render json: { status: 'OK' }.to_json
    else
      render json: { status: 'ERROR', errors: update.errors.full_messages }.to_json
    end
  end

  # DELETE /work_charts/:id.json
  def destroy
    work_chart = WorkChart.find params[:id]
    
    destroy = WorkCharts::DestroyWorkChart.run work_chart: work_chart

    if destroy.errors.empty?
      log_state work_chart
      render json: { status: 'OK' }.to_json
    else
      render json: { status: 'ERROR', errors: destroy.errors.full_messages },
        status: 400
    end
  end

  # GET /work_charts/#id/find_heirs, generates
  # list of work chart children who inherit
  # durations sets from currently selected chart 
  def find_heirs
    # TODO: Refactor the following:
    heirs = Array.new
    wc_children = WorkChart.where(parent_id: params[:id]).all
    wc_children.each { |heir| heirs.push heir.display_label if !heir.has_customized_set? }
    render json: heirs
  end
  
  # Saves duration kinds for given chart
  def save_durations
    work_chart = WorkChart.find params[:id]

    update = WorkCharts::UpdateWorkChartKinds.run work_chart: work_chart,
      work_chart_kinds: params[:work_chart_kinds].values,
      work_chart_kinds_defaults: params[:work_chart_kinds_defaults]

    if update.errors.empty?
      render json: { status: 'OK' }.to_json
    else
      # TODO: Make error handling the same throughout the application
      render json: { status: 'ERROR', errors: update.errors.full_messages },
        status: 400
    end
  end

  def clear_durations
    work_chart = WorkChart.find params[:id]

    delete = WorkCharts::DeleteWorkChartKindsSet.run work_chart: work_chart

    if delete.errors.empty?
      render json: { status: 'OK' }.to_json
    else
      render json: { status: 'ERROR', errors: delete.error.full_messages },
        status: 400
    end
  end

  private

  # Returns 401 if user can't edit charts
  def ensure_can_edit_charts
    return_401 unless effective_user.can_edit_charts
  end

end
