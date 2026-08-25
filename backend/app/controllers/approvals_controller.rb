class ApprovalsController < ApplicationController
  def index
    @approvals = ApprovalsSummary.where('? = any(approval_owner_ids)', effective_user.role_id)
    @effective_user = effective_user
    render json: @approvals
  end

  def stats
    base_query = WorkEntry.joins("INNER JOIN approvals ON work_entries.id = approvals.work_entry_id AND #{effective_user.role_id} = any(approvals.owner_ids) AND approvals.    approved IS NULL")
    render json: { left: base_query.count, last_from: base_query.select('work_entries.date_performed').order('work_entries.date_performed asc').first.try(:date_performed) || nil }
  end

  def undo_last
    if effective_user
      @result = Approvals::UndoLastApproval.run user: effective_user
      if @result.errors.empty?
        render status: 200, json: {}
      else
        render status: 400, json: { errors: @result.errors.full_messages }
      end
    else
      render status: 401 , json: { errors: [ "You have to be logged in first" ] }
    end
  end

  def update
    @entry = WorkEntry.where(id: params[:id]).first
    if @entry.nil?
      render status: 404, plain: ""
    else
      @result = Approvals::UpdateApproval.run work_entry: @entry, user: effective_user, approved: params[:approved], comment: params[:comment]
      if @result.errors.empty?
        render status: 200, json: {}
      else
        render status: 400, json: { errors: @result.errors.full_messages }
      end
    end
  end

  def batch_update
    @result = Approvals::BatchUpdateApprovals.run date_older_than: params[:date_older_than], user: effective_user, approved: params[:approved]

    if @result.errors.empty?
      render status: 200, json: {}
    else
      render status: 400, json: { errors: @result.errors.full_messages }
    end
  end
end
