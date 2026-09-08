require 'spec_helper'

# /team/teams feeds the calendar's "Calendar for user" dropdown and
# /team/totals feeds the team hours view. Both used to ignore who was asking:
# teams rendered Team.all, and totals filtered on the date range alone.
#
# `teams` is a database view over roles, so building one here means creating
# what the view actually joins on rather than inserting a row.
describe "Team endpoints only return what the caller may see" do
  # A team is a role tagged 'operational', with member user-roles pointing at
  # it, and a manager holding manage_team targeted at it.
  def build_team(code, members: [], manager: nil)
    operational = Role.find_by(code: 'operational') ||
      FactoryBot.create(:role, code: 'operational', gen_user: false)

    team = FactoryBot.create(:role, code: code, display_label: code, gen_user: false)
    FactoryBot.create(:role_has_role, role_id: team.id, has_role_id: operational.id)

    members.each do |member|
      FactoryBot.create(:role_has_role, role_id: member.role.id, has_role_id: team.id)
    end

    if manager
      type  = RightType.find_by(code: 'manage_team') ||
        FactoryBot.create(:right_type, code: 'manage_team')
      right = FactoryBot.create(:right, role_id: manager.role.id, right_type_id: type.id)
      FactoryBot.create(:right_target, right_id: right.id, ref_obj_pk: team.id)
    end

    team
  end

  before(:each) do
    @manager = create_correct_user
    login_sucessfully

    @member    = FactoryBot.create :user
    @outsider  = FactoryBot.create :user

    build_team 'engineering_team', members: [@member], manager: @manager
    build_team 'sales_team',       members: [@outsider]
  end

  it "returns only the teams the caller manages or belongs to" do
    get "/api/team/teams.json"

    response.status.should == 200
    codes = JSON.parse(response.body).map { |t| t["code"] }
    codes.should include("engineering_team")
    codes.should_not include("sales_team")
  end

  it "does not leak the members of a team the caller has nothing to do with" do
    get "/api/team/teams.json"

    members = JSON.parse(response.body).flat_map { |t| t["users"].keys }
    members.should_not include(@outsider.role.code)
  end

  it "still returns every team to an admin" do
    grant_superuser
    get "/api/team/teams.json"

    codes = JSON.parse(response.body).map { |t| t["code"] }
    codes.should include("engineering_team", "sales_team")
  end
end
