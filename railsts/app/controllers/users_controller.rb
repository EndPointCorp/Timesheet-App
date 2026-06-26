class UsersController < ApplicationController
  before_action :ensure_logged_in

  # GET /users/current.json
  #
  # # Returns current user (User)
  def current
    @current_user = current_user
    @effective_user = effective_user
  end

  # GET /users.json
  #
  # Returns all users
  def all
    @all_users = User.where("email not in (?)", [ "root@domain.com", "timesheet@endpointdev.com" ]).order(:username)

    render json: @all_users
  end

  # GET /users/details.json
  def details
    if params[:user_id].present?
      @user_detail = UserDetail.find params[:user_id]
      render :user_detail
    else
      @user_details = UserDetail.all
      render :details
    end
  end

  # POST /users.json
  def create
    if current.is_admin? === false && current.can_create_users? === false
      render json: { errors: ["Current user can't create other users."] }, status: 401

      return
    end

    teamsArr = []
    params[:teams] = params[:teams].to_a
    params[:teams].each do |k, v|
      teamsArr.push v['code']
    end
    params[:teams] = teamsArr
    params['username'] = params['email'][/^[^\@]*/]
    params[:effective_role_id] = effective_user.role_id

    @user = Users::CreateUser.run(params.permit(:email, :username, :name, :time_zone_code, :password, :start_date, :effective_role_id, teams: []))
    if !@user.errors.any? and @user.valid?
      render json: @user.result.to_json
    else
      render json: { errors: @user.errors.full_messages }, status: 400
    end
  end

  # PUT /users/{id}.json
  #
  # Update one individual user
  def update
    @user = Users::UpdateUser.run id: params[:user_id],
      user_entity: params[:user_entity],
      user: effective_user

    if !@user.errors.any? and @user.valid?
      render json: @user.result.to_json
    else
      render json: { errors: @user.errors.full_messages }, status: 400
    end
  end

  # GET /users/others.json
  #
  # Returns all users, current user can switch to.
  # Switching to other user means assuming thet he/she is this other user
  # and accessing month, day and entries data for this user in subsequent
  # requests.
  def others
    @others = effective_user.others_accessible + User.where(role_id: effective_user["role_id"])
    @others = @others.sort_by {|u| u.username }
  end

  # GET /users/all_roles.json
  #
  # Returns all users with roles
  def all_roles
    @all_roles = User.includes(:role).where("email <> ?", "root@domain.com").order(:username)
  end

  # GET /users/all_groups_teams.json
  #
  # Returns all users with groups and teams
  def all_groups_teams
    @users_groups_teams = User.includes(:role).where("email <> ?", "root@domain.com").order(:username)

    @users_list = User.includes(:role).select("users.id, users.email, users.name, role_id, status_code, time_zone_code")

    @users_list = @users_list.sort_by{ |user| (!user[:name].nil?)? user[:name].downcase : "(user[:name] || '')" }
    @users = {}
    @users_list.each { |user|
      @user = {}
      @user[:id] = user.id
      @user[:role_id] = user.role_id
      @user[:email] = user.email
      @user[:name] = user.name
      @user[:status_code] = user.status_code
      @user[:status] = user.status_code == 'enabled'
      @user[:time_zone] = user.time_zone_code
      @user[:teams] = user.role.roles.select("roles.id, roles.display_label label").joins({role_has_roles: :role}).where(roles: { code: 'operational' })
      @user[:groups] = user.role.roles.includes({rights: :right_type}).select("roles.id, roles.display_label label").joins(role_has_roles: :role).where.not(roles: { code: 'operational'}).uniq
      @users_groups_teams[user.id] = @user
    }

    render json: @users_groups_teams
  end

  # GET /users/reportable.json
  #
  # Returns all users that current user can report on.
  def reportable
    @roles = effective_user.reportable_users.sort_by(&:username)
  end

  # POST /users/assume.json
  #
  # Assumes role of another user
  def assume
    role_id = User.where(email: params[:email]).first.role_id

    if current_user.can_switch_roles
      if current_user.email == params[:email]
        session[:assume_role_id] = nil
      else
        session[:assume_role_id] = role_id
      end
      render json: "ok".to_json
    else
      session[:assume_role_id] = nil
      render json: { errors: "User cannot switch roles" }, status: 400
    end
  end

  # PUT /users/{id}/disable
  def disable
    @user = Users::DisableUser.run id: params[:id],
      status_code: params[:status_code]

    if @user.valid?
      render json: @user.result.to_json
    else
      render json: { errors: @user.errors.full_messages }, status: 400
    end
  end

  # DELETE /users/{id}.json
  #
  # Destroys a user
  def destroy
    @user = User.find(params[:id])
    @user.destroy
    render json: ""
  end
end
