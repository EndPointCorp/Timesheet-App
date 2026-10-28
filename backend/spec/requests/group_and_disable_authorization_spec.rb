require 'spec_helper'

# Three requests change who has access and who can sign in:
#
# - POST /groups           creates a group
# - PUT  /groups/:id       renames a group and adds or removes its rights and roles
# - PUT  /users/:id/disable turns an account on or off
#
# The rule: all three need the superuser right. Creating a group is held to the
# same right as managing one, because a person who could create a group could
# not do anything with it. The only way to reach the New Group page is the
# button inside the Groups editor, which is for admins. create_users still
# lets someone create a user, just not a group.
#
# Anyone else is refused with 403 and nothing changes. The lists that the
# Reports page reads (GET /groups and friends) stay open to every logged-in
# user on purpose, so they are not covered here.
describe "Who may create groups, change groups and disable users" do
  before(:each) do
    create_real_right_types

    @superuser    = RightType.find_by!(code: 'superuser')
    @create_users = RightType.find_by!(code: 'create_users')
    @manage       = RightType.find_by!(code: 'manage', target_kind_code: 'work_chart')

    @plain  = create_correct_user("plain@endpointdev.com")
    @maker  = create_correct_user("maker@endpointdev.com")
    give_right(@maker, @create_users)
    @editor = create_correct_user("editor@endpointdev.com")
    give_right(@editor, @manage)
    @admin  = create_correct_user("admin@endpointdev.com")
    give_right(@admin, @superuser)

    @group  = FactoryBot.create(:role, display_label: 'Group of gnus', code: 'group3', gen_user: false)
    @target = FactoryBot.create(:user)
  end

  # --- helpers ---------------------------------------------------------

  def give_right(user, type)
    FactoryBot.create :right, role_id: user.role_id, right_type_id: type.id
  end

  def sign_in_as(email)
    login_sucessfully(email)
  end

  # What the Groups editor sends: a JSON body with the changes as a JSON string.
  def put_group_changes(changes)
    put "/api/groups/#{@group.id}",
        params: { group_id: @group.id, group_entity: changes.to_json },
        as: :json
  end

  def post_new_group
    post "/api/groups.json",
         params: { label: 'New Group', code: 'new_group', description: 'made in a spec' }
  end

  def put_disable
    put "/api/users/#{@target.id}/disable", params: { id: @target.id, status_code: 'disabled' }
  end

  # Everything a refused request must leave alone.
  def state
    [
      Role.order(:id).pluck(:id, :code, :display_label),
      User.order(:id).pluck(:id, :status_code),
      Right.order(:id).pluck(:id, :role_id, :right_type_id),
      RoleHasRole.order(:role_id, :has_role_id).pluck(:role_id, :has_role_id)
    ]
  end

  def expect_refused(what)
    before = state
    yield

    response.status.should(eq(403), "expected 403 for #{what}, got #{response.status}")
    JSON.parse(response.body)['errors'].should be_present
    state.should(eq(before), "#{what} was refused but still changed something")
  end

  # The changes the Groups editor can send.
  def group_changes
    other = FactoryBot.create(:role, gen_user: false)
    {
      "rename a group"                  => { 'isChanged' => true, 'label' => 'Renamed' },
      "give a group the superuser right" => { 'isChanged' => true,
                                              'myrights' => [{ 'id' => @superuser.id, 'status' => 'add' }] },
      "put a role inside a group"       => { 'isChanged' => true,
                                              'myroles' => [{ 'id' => other.id, 'status' => 'add' }] }
    }
  end

  # --- not logged in ---------------------------------------------------

  context "when nobody is logged in" do
    it "answers 401 to all three, because there is no caller to judge" do
      before = state

      post_new_group
      response.status.should eq(401)
      put_group_changes({ 'isChanged' => true, 'label' => 'Renamed' })
      response.status.should eq(401)
      put_disable
      response.status.should eq(401)

      state.should eq(before)
    end
  end

  # --- no rights, and a right that is not the right one ------------------

  {
    "a user with no rights"            => "plain@endpointdev.com",
    "a chart editor (manage on charts)" => "editor@endpointdev.com"
  }.each do |who, email|
    context "when #{who} calls" do
      before(:each) { sign_in_as(email) }

      it "is refused when creating a group" do
        expect_refused("creating a group") { post_new_group }
      end

      it "is refused every group change the Groups editor can send" do
        group_changes.each do |what, changes|
          expect_refused(what) { put_group_changes(changes) }
        end
      end

      it "is refused when disabling a user" do
        expect_refused("disabling a user") { put_disable }
      end
    end
  end

  # --- create_users only -----------------------------------------------

  context "when a user with only the create_users right calls" do
    before(:each) { sign_in_as("maker@endpointdev.com") }

    it "is refused when creating a group, because that right is for creating users" do
      expect_refused("creating a group") { post_new_group }
    end

    it "is refused every group change" do
      group_changes.each do |what, changes|
        expect_refused(what) { put_group_changes(changes) }
      end
    end

    it "is refused when disabling a user" do
      expect_refused("disabling a user") { put_disable }
    end
  end

  # --- admin -----------------------------------------------------------

  context "when an admin calls" do
    before(:each) { sign_in_as("admin@endpointdev.com") }

    it "may create a group" do
      expect { post_new_group }.to change { Role.where(code: 'new_group').count }.by(1)

      response.status.should eq(200)
    end

    it "may rename a group" do
      put_group_changes({ 'isChanged' => true, 'label' => 'Renamed' })

      response.status.should eq(200)
      @group.reload.display_label.should eq('Renamed')
    end

    it "may give a group a right" do
      put_group_changes({ 'isChanged' => true,
                          'myrights' => [{ 'id' => @create_users.id, 'status' => 'add' }] })

      response.status.should eq(200)
      Right.where(role_id: @group.id, right_type_id: @create_users.id).count.should eq(1)
    end

    it "may disable a user" do
      put_disable

      response.status.should eq(200)
      @target.reload.status_code.should eq('disabled')
    end
  end

  # --- an admin acting as someone else -----------------------------------

  context "when an admin is acting as a user with no rights" do
    before(:each) do
      sign_in_as("admin@endpointdev.com")
      post '/api/users/assume.json', params: { email: "plain@endpointdev.com" }
      session[:assume_role_id].should eq(@plain.role_id)
    end

    it "is judged as that user, the same way the user update check is" do
      expect_refused("creating a group") { post_new_group }
      expect_refused("renaming a group") { put_group_changes({ 'isChanged' => true, 'label' => 'Renamed' }) }
      expect_refused("disabling a user") { put_disable }
    end
  end
end
