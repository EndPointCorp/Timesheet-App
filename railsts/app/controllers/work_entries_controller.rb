# Serving and persisting of work entries
class WorkEntriesController < ApplicationController
  respond_to :json
  before_action :ensure_logged_in
  before_action :build_work_entry, only: :show
  before_action :check_user_allowed, only: :show

  # GET /work_entries/day.json?day=:date
  #
  # Returns all entries for given day.
  def day 
    @entries = EntryDailySummary.where(role_id: effective_user.role_id, 
                               date_performed: params[:day])
                               .sort_by { |item| [item.work_chart_label_parts]}
    @effective_user = effective_user
  end

  # GET /work_entries/:id.json
  def show
    respond_with(@work_entry)
  end

  # POST /work_entries/:id/reclaim.json
  def reclaim
    @reclaim = Approvals::UndoLastApproval.run user: effective_user,
      id: params[:id]
    if @reclaim.errors.empty?
      render json: {}
    else
      render status: 400, json: {status: 'ERROR', errors: @reclaim.errors.full_messages}.to_json
    end
  end

  # PUT /work_entries/:id.json
  def update
    p = params[:work_entry]
    @update = WorkEntries::UpdateWorkEntry.run user: effective_user,
      description: p[:description].gsub(/\r\n?/,"\n"),
      id:          p[:id].to_i,
      date_performed: DateTime.parse(p[:date_performed]),
      work_chart_id: p[:work_chart_id].to_i,
      fee:         p[:work_entry_fees_attributes]['0'][:fee].to_f,
      durations:   p[:work_entry_durations_attributes].to_h.map { |k, v| 
        { 
          kind_code: v[:kind_code], 
          id:        v[:id].try(:to_i), 
          duration:  v[:duration].try(:to_f) 
        } 
      }

    if @update.errors.empty?
      render json: @update.result.to_json(include: {work_entry_fees: {}, work_entry_durations: {}})
    else
      render status: 400, json: {status: 'ERROR', errors: @update.errors.full_messages}.to_json
    end

  end

  # DELETE /work_entries/:id.json
  def destroy
    @destroy = WorkEntries::DestroyWorkEntry.run work_entry_id: params[:id], user: effective_user
    if @destroy.errors.empty?
      render json: { status: 'OK' }
    else
      render status: 400, json: { errors: @destroy.errors.full_messages }
    end
  end

  # POST /work_entries.json
  def create
    p = params[:work_entry]

    @update = WorkEntries::CreateWorkEntry.run user: effective_user,
      description: p[:description].gsub(/\r\n?/,"\n"),
      date_performed: DateTime.parse(p[:date_performed]),
      work_chart_id: p[:work_chart_id].to_i,
      fee:         p[:work_entry_fees_attributes]['0'][:fee].to_f,
      durations:   p[:work_entry_durations_attributes].to_h.map { |k, v| 
        { 
          kind_code: v[:kind_code], 
          duration:  v[:duration].try(:to_f) 
        } 
      }

    if @update.errors.empty?
      render json: @update.result.to_json(include: {work_entry_fees: {}, work_entry_durations: {}})
    else
      render status: 400, json: {status: 'ERROR', errors: @update.errors.full_messages}.to_json
    end
   
  end

  # GET /work_entries/:id/previous_next.json
  #
  # Returns ids of previous & next entries
  def previous_next
    base    = WorkEntry.find params[:id]
    date    = base.date_performed.to_s(:db)
    role_id = effective_user.role_id
    prev_id = WorkEntry.where(role_id: role_id)
                       .where("date_performed < DATE(?) OR (date_performed = DATE(?) AND id < ?)", 
                              date, date, base.id)
                       .select([:id, :date_performed])
                       .order("date_performed DESC")
                       .first.id rescue nil
    next_id = WorkEntry.where(role_id: role_id)
                       .where("date_performed > DATE(?) OR (date_performed = DATE(?) AND id > ?)", 
                              date, date, base.id)
                       .select([:id, :date_performed])
                       .order("date_performed ASC")
                       .first.id rescue nil
    render json: {prev_id: prev_id, next_id: next_id}.to_json
  end

  private
  def build_work_entry
    @work_entry = WorkEntry.includes(:work_entry_durations, :work_entry_fees)
                           .find params[:id]
  end

  def check_user_allowed
    return_401 if !@work_entry.is_editable_by?(effective_user)
  end
end
