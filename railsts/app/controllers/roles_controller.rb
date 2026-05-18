# Controller serving roles related data
class RolesController < ApplicationController
  before_action :ensure_logged_in

  # GET /roles.json
  #
  # Returns all the roles
  def all
    @all_roles = RoleDetail.all

    render json: JSON.dump(@all_roles)
  end

  # POST /roles/create_role
  #
  # Creates a new role
  def create_role
    @role = Users::CreateRole.run(params)
    if @role.valid?
      render json: @role.result.to_json
    else
      render json: { errors: @role.errors.full_messages }, status: 400
    end
  end
end
