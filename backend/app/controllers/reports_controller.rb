# Controller for reports related routes.
#
# All handlers accept following parameters:
# * start_date :: date string
# * end_date   :: date string
# * work_chart_id  :: integer
# * option :: enum ( from_selected | all | children )
class ReportsController < ApplicationController
  before_action :ensure_logged_in
  before_action :report_limitation_check,
    :check_time_span, :check_user_rights, :check_workchart_rights, except: [:create_preset, :presets, :remove_preset]

  respond_to :json

  # GET /reports/billing.json
  def billing
    @document = Report::Billing.by_params(params)

    respond_to do |format|
      format.html do
        render @document.view, locals: { effective_user: effective_user }
      end
      format.pdf do
        send_data ReportPresenter.pdf_for(params, @document, Report::Billing, effective_user), type: 'application/pdf',
          disposition: 'inline'
      end
    end
  end

  # GET /reports/standard.json
  def standard
    @document = Report::Standard.by_params(params)

    respond_to do |format|
      format.html do
        render @document.view, locals: { effective_user: effective_user }
      end
      format.pdf do
        send_data ReportPresenter.pdf_for(params, @document, Report::Standard, effective_user), type: 'application/pdf',
          disposition: 'inline'
      end
    end
  end

  # GET /reports/by_user.json
  def by_user
    @document = Report::ByUser.by_params(params)

    respond_to do |format|
      format.html do
        render @document.view, locals: { effective_user: effective_user }
      end
      format.pdf do
        send_data ReportPresenter.pdf_for(params, @document, Report::ByUser, effective_user), type: 'application/pdf',
          disposition: 'inline'
      end
    end
  end

  # GET /reports/break.json
  def break
    @document = Report::Break.by_params(params)

    respond_to do |format|
      format.html do
        render @document.view, locals: { effective_user: effective_user }
      end
      format.pdf do
        send_data ReportPresenter.pdf_for(params, @document, Report::Break, effective_user), type: 'application/pdf',
          disposition: 'inline'
      end
    end
  end

  # GET /reports/billing_at_leaf.json
  def billing_at_leaf
    @document = Report::Break.by_params(params)

    respond_to do |format|
      format.html do
        render @document.view, locals: { effective_user: effective_user }
      end
      format.pdf do
        send_data ReportPresenter.pdf_for(params, @document, Report::Break, effective_user), type: 'application/pdf',
          disposition: 'inline'
      end
    end
  end

  def create_preset
    params[:user_id] = effective_user.id
    params[:roles] = params[:roles].try(:values) || ['all']

    @preset = Reports::CreateReportsPreset.run params
    @effective_user = effective_user

    if @preset.valid?
      render json: @preset.to_json
    else
      render json: { errors: @preset.errors.full_messages }, status: 400
    end
  end

  def presets
    @presets = ReportsPreset.where(user_id: effective_user.id)
    @effective_user = effective_user

    @presets = @presets.map do |preset|
      new_preset = preset.attributes

      new_preset
    end

    render json: @presets
  end

  def remove_preset
    params[:user_id] = effective_user.id

    @preset = Reports::RemoveReportsPreset.run params

    if @preset.valid?
      render json: {}
    else
      render json: { errors: @preset.errors.full_messages }, status: 400
    end
  end

  private

  # validating the report generation limitation
  def report_limitation_check
    params[:access]== 'true' ? @status = "ALLOWED" : @status = "DENIED"
    ReportLog.debug("#{DateTime.now.strftime("%Y-%m-%d %H:%M:%S %z")} #{@status} #{params.inspect}")
    render json: { message: "Only one user's report can be generated for more than 90 days with description" } if params[:access] == 'false'
  end

  # Halts execution if start or end wasn't given
  def check_time_span
    return return_406('Start and end date can\'t be blank') if params[:start_date].blank? || params[:end_date].blank?

    from = params[:start_date].is_a?(Date) ? params[:start_date] : DateTime.parse(params[:start_date])
    to = params[:end_date].is_a?(Date) ? params[:end_date] : DateTime.parse(params[:end_date])

    return return_406('End date can\'t be before the start date') if (from > to)
  end

  # Halts execution if user doesn't have enough rights
  def check_user_rights
    params[:user] = effective_user
    return return_406('Not enough permissions to continue') if params[:roles].blank? && params[:work_chart_id].nil?
  end

  # Verifies rights on workcharts
  def check_workchart_rights
    work_chart = WorkChart.find params[:work_chart_id].to_i
    work_chart_paths = work_chart.up_path_ids.map{ |id| Integer(id)}
    has_work_chart_rights = work_chart_paths.count > (work_chart_paths - effective_user.reportable_work_charts).count
    if (effective_user.is_admin? or has_work_chart_rights)
      params[:full_rights] = true
    else
      params[:full_rights] = false
    end
  end

end
