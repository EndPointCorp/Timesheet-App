require 'spec_helper'

# PUT /users/:id applies a free-form list of changes to an account: name, email,
# password, status, time zone, teams, groups and rights. It must only do that
# for people who hold the right to.
#
# - An admin (the superuser right) may change anything.
# - A chart editor (the manage right on work charts) may do one thing: add or
#   remove the project_manage right. That is what the Managers tab of the work
#   chart editor sends.
# - Everyone else is refused with 403, and nothing in the request is applied.
#
# The shapes below are what the real screens send. The "add" shape was captured
# from the Managers tab as a chart editor. For "add" the id is a right TYPE,
# for "update" and "remove" it is a right ROW, and a target to remove is a
# right_targets row id. The spec pins each of those meanings, because a rule
# that confuses them would let a request through.
describe "Who may change a user" do
  before(:each) do
    create_real_right_types
    FactoryBot.create(:time_zone, code: 'US/Eastern') if TimeZone.where(code: 'US/Eastern').count == 0

    @superuser       = RightType.find_by!(code: 'superuser')
    @manage          = RightType.find_by!(code: 'manage', target_kind_code: 'work_chart')
    @project_manage  = RightType.find_by!(code: 'project_manage')

    @chart       = FactoryBot.create(:work_chart)
    @other_chart = FactoryBot.create(:work_chart)

    @plain  = create_correct_user("plain@example.com")
    @editor = create_correct_user("editor@example.com")
    give_right(@editor, @manage, [@chart])
    @admin  = create_correct_user("admin@example.com")
    give_right(@admin, @superuser)

    @target = FactoryBot.create(:user)
  end

  # --- helpers ---------------------------------------------------------

  def give_right(user, type, charts = [])
    right = FactoryBot.create :right, role_id: user.role_id, right_type_id: type.id
    charts.each { |chart| FactoryBot.create :right_target, right_id: right.id, ref_obj_pk: chart.id.to_s }
    right
  end

  # What the real client sends: a JSON body with user_id and the changes as a
  # JSON string. The controller takes the user from the body, not from the URL.
  def put_changes(changes, target: @target, url_id: nil)
    put "/api/users/#{url_id || target.id}",
        params: { user_id: target.id, user_entity: changes.is_a?(String) ? changes : changes.to_json },
        as: :json
  end

  def add_right(type, charts = [])
    entry = { 'id' => type.id, 'status' => 'add' }
    entry['targets'] = charts.map { |chart| { 'id' => chart.id, 'status' => 'add' } } unless charts.empty?
    entry
  end

  def rights_change(*entries)
    { 'isChanged' => true, 'myrights' => entries }
  end

  # Everything a refused request must leave alone.
  def state
    [
      User.order(:id).pluck(:id, :email, :encrypted_password, :status_code, :time_zone_code),
      Right.order(:id).pluck(:id, :role_id, :right_type_id),
      RightTarget.order(:id).pluck(:id, :right_id, :ref_obj_pk),
      RoleHasRole.order(:role_id, :has_role_id).pluck(:role_id, :has_role_id)
    ]
  end

  def expect_refused(changes, what = "the request", **options)
    before = state
    put_changes(changes, **options)

    response.status.should(eq(403), "expected 403 for #{what}, got #{response.status}")
    JSON.parse(response.body)['errors'].should be_present
    state.should(eq(before), "#{what} was refused but still changed something")
  end

  # The changes the Roles editor can send, none of which a non-admin may make.
  def account_changes
    some_group = FactoryBot.create(:role, gen_user: false)
    {
      "change someone's email"       => { 'isChanged' => true, 'email' => 'taken-over@example.test' },
      "change someone's password"    => { 'isChanged' => true, 'password' => 'new-password-1' },
      "disable someone"              => { 'isChanged' => true, 'status' => false },
      "change someone's time zone"   => { 'isChanged' => true, 'time_zone' => 'US/Eastern' },
      "add someone to a group"       => { 'isChanged' => true, 'myroles' => [{ 'id' => some_group.id, 'status' => 'add' }] },
      "add someone to a team"        => { 'isChanged' => true, 'myteam' => [{ 'id' => some_group.id, 'status' => 'add' }] },
      "give someone the superuser right" => rights_change(add_right(@superuser))
    }
  end

  # --- not logged in ---------------------------------------------------

  context "when nobody is logged in" do
    it "answers 401, because there is no caller to judge" do
      before = state
      put_changes({ 'isChanged' => true, 'email' => 'taken-over@example.test' })

      response.status.should eq(401)
      state.should eq(before)
    end
  end

  # --- a user with no rights ------------------------------------------

  context "when the caller has no rights" do
    before(:each) { login_sucessfully("plain@example.com") }

    it "refuses every kind of account change, and changes nothing" do
      account_changes.each do |what, changes|
        expect_refused(changes, what)
      end
    end

    it "refuses to give the caller the superuser right" do
      expect_refused(rights_change(add_right(@superuser)), target: @plain)

      @plain.reload.is_admin?.should eq(false)
    end

    it "refuses to add a project manager, because that is for chart editors" do
      expect_refused(rights_change(add_right(@project_manage, [@chart])))
    end
  end

  # --- a chart editor --------------------------------------------------

  context "when the caller is a chart editor" do
    before(:each) { login_sucessfully("editor@example.com") }

    let(:pm_row)        { give_right(@target, @project_manage, [@chart]) }
    let(:manage_row)    { give_right(@target, @manage, [@other_chart]) }
    let(:someone_else)  { FactoryBot.create(:user) }
    let(:someone_elses_pm_row) { give_right(someone_else, @project_manage, [@chart]) }

    describe "what the Managers tab sends" do
      it "adds a project manager to a chart" do
        put_changes(rights_change(add_right(@project_manage, [@chart])))

        response.status.should eq(200)
        right = Right.find_by!(role_id: @target.role_id, right_type_id: @project_manage.id)
        right.targets.map(&:ref_obj_pk).should eq([@chart.id.to_s])
      end

      it "adds a project manager to a second chart, using the right they already have" do
        put_changes(rights_change(
          'id' => pm_row.id, 'status' => 'update',
          'targets' => [{ 'id' => @other_chart.id, 'status' => 'add' }]))

        response.status.should eq(200)
        pm_row.reload.targets.map(&:ref_obj_pk).sort.should eq([@chart.id.to_s, @other_chart.id.to_s].sort)
      end

      it "removes a project manager" do
        put_changes(rights_change('id' => pm_row.id, 'status' => 'remove'))

        response.status.should eq(200)
        Right.exists?(pm_row.id).should eq(false)
      end

      it "removes one chart from a project manager" do
        target_row = pm_row.targets.first
        put_changes(rights_change(
          'id' => pm_row.id, 'status' => 'update',
          'targets' => [{ 'id' => target_row.id, 'status' => 'remove' }]))

        response.status.should eq(200)
        RightTarget.exists?(target_row.id).should eq(false)
      end

      it "acts on the user in the body, as the update does, not on the user in the URL" do
        put_changes(rights_change(add_right(@project_manage, [@chart])), target: @target, url_id: @plain.id)

        response.status.should eq(200)
        Right.where(role_id: @target.role_id, right_type_id: @project_manage.id).count.should eq(1)
        Right.where(role_id: @plain.role_id,  right_type_id: @project_manage.id).count.should eq(0)
      end
    end

    describe "anything else" do
      it "refuses every kind of account change, and changes nothing" do
        account_changes.each do |what, changes|
          expect_refused(changes, what)
        end
      end

      it "refuses to give the caller the superuser right" do
        expect_refused(rights_change(add_right(@superuser)), target: @editor)

        @editor.reload.is_admin?.should eq(false)
      end

      it "refuses to add a right that is not project_manage" do
        expect_refused(rights_change(add_right(@manage, [@chart])))
      end

      it "refuses to update a right that is not project_manage" do
        expect_refused(rights_change(
          'id' => manage_row.id, 'status' => 'update',
          'targets' => [{ 'id' => @chart.id, 'status' => 'add' }]))
      end

      it "refuses to remove a right that is not project_manage" do
        expect_refused(rights_change('id' => manage_row.id, 'status' => 'remove'))
      end

      it "refuses a project_manage right that belongs to someone other than the user in the request" do
        expect_refused(rights_change(
          'id' => someone_elses_pm_row.id, 'status' => 'update',
          'targets' => [{ 'id' => @other_chart.id, 'status' => 'add' }]))
      end

      it "refuses to remove a target that belongs to a different right" do
        foreign_target = manage_row.targets.first
        expect_refused(rights_change(
          'id' => pm_row.id, 'status' => 'update',
          'targets' => [{ 'id' => foreign_target.id, 'status' => 'remove' }]))
      end

      it "refuses to remove someone's target by hiding the removal inside an add" do
        foreign_target = manage_row.targets.first
        expect_refused(rights_change(
          'id' => @project_manage.id, 'status' => 'add',
          'targets' => [{ 'id' => foreign_target.id, 'status' => 'remove' }]))
      end

      it "refuses to add a target that is not a work chart" do
        expect_refused(rights_change(
          'id' => @project_manage.id, 'status' => 'add',
          'targets' => [{ 'id' => 999_999, 'status' => 'add' }]))
      end

      it "refuses a key it does not know" do
        expect_refused({ 'isChanged' => true, 'surprise' => 1 })
      end

      it "refuses changes that are not valid JSON, and does not fail with a 500" do
        expect_refused('this is not json')
      end

      it "refuses a request that mixes an allowed change with a refused one, and applies neither" do
        expect_refused(rights_change(
          add_right(@project_manage, [@chart]),
          add_right(@superuser)))

        Right.where(role_id: @target.role_id).count.should eq(0)
      end
    end
  end

  # --- an admin ---------------------------------------------------------

  context "when the caller is an admin" do
    before(:each) { login_sucessfully("admin@example.com") }

    it "may change an email" do
      put_changes({ 'isChanged' => true, 'email' => 'changed@example.test' })

      response.status.should eq(200)
      @target.reload.email.should eq('changed@example.test')
    end

    it "may change a time zone" do
      FactoryBot.create(:time_zone, code: 'Europe/Warsaw', utc_offset: 1, is_visible: true)
      put_changes({ 'isChanged' => true, 'time_zone' => 'Europe/Warsaw' })

      response.status.should eq(200)
      @target.reload.time_zone_code.should eq('Europe/Warsaw')
    end

    it "may give another user a right, including superuser" do
      put_changes(rights_change(add_right(@superuser)))

      response.status.should eq(200)
      @target.reload.is_admin?.should eq(true)
    end

    it "may make several kinds of change in one request" do
      put_changes({ 'isChanged' => true, 'email' => 'changed@example.test',
                    'myrights' => [add_right(@project_manage, [@chart])] })

      response.status.should eq(200)
      @target.reload.email.should eq('changed@example.test')
      Right.where(role_id: @target.role_id, right_type_id: @project_manage.id).count.should eq(1)
    end
  end

  # --- an admin acting as someone else ----------------------------------

  context "when an admin is acting as a user with no rights" do
    it "is judged as that user, the same way the chart editing check is" do
      login_sucessfully("admin@example.com")
      post '/api/users/assume.json', params: { email: "plain@example.com" }
      session[:assume_role_id].should eq(@plain.role_id)

      expect_refused({ 'isChanged' => true, 'email' => 'taken-over@example.test' })
    end
  end
end
