class TransactionsController < ApplicationController
  respond_to :json
  before_action :ensure_logged_in
  before_action :fetch_work_chart, except: [ :delete, :update ]

  def index
   @transactions = @work_chart.transactions.order('date DESC, updated_at DESC')
   respond_with @transactions
  end

  def show
    @transaction = Transaction.find params[:id]
  end

  def update
    _params = params.permit(:work_chart_id, :hours, :description, :id,
                            :mode, :date, :date_closed, :recur_mode,
                            {
                              recur_at: [
                                :minutes, :hours, :day_of_month, :month,
                                :day_of_week, :year
                              ]
                            },
                            :user_id)
    @transaction = Transactions::UpdateTransaction.run _params

    if @transaction.valid?
      render json: @transaction.to_json
    else
      render json: { errors: @transaction.errors.full_messages }, status: 400
    end
  end

  def delete
    @transaction = Transactions::DeleteTransaction.run id: params[:id], user: effective_user

    if @transaction.valid?
      render json: {}
    else
      render json: { errors: @transaction.errors.full_messages }, status: 400
    end
  end

  def create
    params[:user_id] = effective_user.id
    @transaction = Transactions::CreateTransaction.run(transaction_params)


    if @transaction.valid?
      render json: @transaction.to_json
    else
      render json: { errors: @transaction.errors.full_messages }, status: 400
    end
  end

  private

  def fetch_work_chart
    @work_chart = WorkChart.find params[:work_chart_id]
  end

  def transaction_params
    params.permit(
      :work_chart_id,
      :hours,
      :description,
      :mode,
      :kind_code,
      :date,
      :date_closed,
      {
        recur_at: [
          :hours,
          :day_of_month,
          :month,
          :day_of_week,
          :year
        ]
      },
      :user_id
    )
  end
end
