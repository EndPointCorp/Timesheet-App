class ApplicationController < ActionController::Base
  before_action :set_front_version_header
  before_action :set_charts_version_header
  before_action :set_csrf_cookie

  after_action :dump_state_log

  # before_action :assume_other_role, if: Proc.new { !session[:assume_role_id].nil? }

  before_action :log_user
  before_action :permit_params

  def permit_params
    # TODO: Make use of the parameters permitting in specific controllers
    # The following workaround brings back the old security model for now:
    params.permit!
  end

  def ensure_logged_in
    return_401 unless effective_user
  end

  def pick(hash, *keys)
    filtered = {}
    hash.each do |key, value|
      filtered[key.to_sym] = value if keys.include?(key.to_sym)
    end
    filtered
  end

  def return_401
    head 401
  end

  def return_406(message = nil)
    if message.nil?
      head 406
    else
      render json: { errors: [message] }, status: 406
    end
  end

  def effective_user
    if session.fetch(:assume_role_id, nil).present?
      User.find_by(role_id: session[:assume_role_id])
    else
      current_user
    end
  end

  def log_user
    Rails.logger.info "#{effective_user.try(:email) || 'not-logged-in'} - #{request.env["HTTP_USER_AGENT"]}"
  end

  # Sets Front-Version header for every request.
  # It is used by th web client to determine if it needs reloading.
  # (in case when the newer version of code was deployed)
  def set_front_version_header
    version_sum = File.read("public/front.version")
    response.headers['Front-Version'] = version_sum
  end

  def set_charts_version_header
    sum = if WorkChart.count != 0
      mod = WorkChart.select([:last_modified]).order('last_modified DESC').first[:last_modified]
      cre = WorkChart.select([:date_created]).order('date_created DESC').first[:date_created]
      `echo "#{mod} #{cre}" | md5sum`.split(' ').first
    else
      ''
    end
    response.headers['Charts-Version'] = sum
  end

  # adds current state of given object along with info about
  # current action
  def log_state(object)
    @objects_state ||= {}
    @objects_state[object.object_id] = [] if @objects_state[object.object_id].nil?
    @objects_state[object.object_id] << ((object.respond_to? :to_custom_json) ? object.to_custom_json : object.to_json)
  end

  # dumps logged state in this request to disk
  # appending log/persistance.log
  def dump_state_log
    File.open(File.join(Rails.root, "log", "persistance.log"), "a") do |f|
      @objects_state.values.each do |state|
        entry = {before: state.first}
        entry[:after] = state.last if state.count > 1
        entry[:action] = params[:action]
        entry[:controller] = params[:controller]
        f.puts entry.to_s
      end if @objects_state
    end
  end

  private

  def set_csrf_cookie
    cookies["CSRF-TOKEN"]= form_authenticity_token
  end
end
