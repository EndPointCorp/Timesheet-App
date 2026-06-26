class GroupsController < ApplicationController
  before_action :ensure_logged_in

  # GET /groups.json
  #
  # Returns all groups
  def all
    @groups_list = RoleDetail.where("code not like 'user_%'").select("id, code, code AS value, label")
    render json: @groups_list
  end

  # GET /groups/groups_no_teams.json
  #
  # Returns all groups
  def groups_no_teams
    @groups_list = RoleDetail.where.not(id: Team.select(:role_id)).where("code not like 'user_%'").select("id, code, code AS value, label")
    render json: @groups_list
  end

  # GET /groups/groups_with_roles.json
  #
  # Returns groups that has roles
  def groups_with_roles
    @groups_list = RoleDetail.select("id, code AS value, label").where("code not like 'user_%'")
    render json: @groups_list
  end

  # GET /groups/details.json
  #
  # Returns all groups details
  def details
    @all_groups = RoleDetail.where("code not like 'user_%'")

    render json: @all_groups
  end

  # PUT /groups/{id}
  def update
    @group = Users::UpdateGroup.run id: params[:group_id],
      group_entity: params[:group_entity],
      user: effective_user

    if @group.valid?
      render json: @group.result.to_json
    else
      render json: { errors: @group.errors.full_messages }, status: 400
    end
  end

  # POST /groups.json
  def create
    params[:user] = effective_user
    @role = Users::CreateRole.run(params)
    if @role.valid?
      render json: @role.result.to_json
    else
      render json: { errors: @role.errors.full_messages }, status: 400
    end
  end

  # GET /groups/teams.json
  #
  # Returns all teams
  def all_teams
    @teams_list = Team.select("role_id, code AS value, display_label AS label")
    teams_mapped_list = @teams_list.map do |team|
      {
        id: team.role_id,
        label: team.label,
        value: team.value
      }
    end
    
    render json: teams_mapped_list
  end
end
