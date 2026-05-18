class ClientLogController < ApplicationController
  def logger
    @@logger ||= Logger.new("#{Rails.root}/log/client_log.log")
  end

  def log
    logger.info(params[:lg])

    render json: 'ok'.to_json
  end
end