require 'spec_helper'

describe "Users" do
  before(:each) do
    @user = create_correct_user
    login_sucessfully
  end

  
  describe "GET /users.json" do
    it "returns a JSON array of users" do
      other = FactoryBot.create(:user)

      get "/api/users.json"

      response.should be_successful
      body = JSON.parse(response.body)
      body.should be_an(Array)
      ids = body.map { |u| u['id'] }
      ids.should include(@user.id)
      ids.should include(other.id)
    end
  end

  describe "POST /users.json" do
    it "saves the new user in database", focus: true do
      FactoryBot.create(:right_type, code: "naggable", display_label: "Naggable")
      @right_type = FactoryBot.create(:right_type, code: "create_users", display_label: "Create Users")
      @right = FactoryBot.create(:right, role_id: @user.role_id, right_type_id: @right_type.id)
      @right_target = FactoryBot.create(:right_target, right_id: @right.id, ref_obj_pk: @user.id)
      FactoryBot.create(:time_zone, code: 'US/Eastern') if TimeZone.where(code: 'US/Eastern').count == 0

      _params = { email: 'testy@tester.com', username: 'Testy',
        name: 'Testy', time_zone_code: 'US/Eastern', password: 'sweetkitties', start_date: '23-12-2014' }
      post '/api/users.json', params: _params
      response.status.should == 200
      User.count.should == 2
      emails = User.all.map(&:email)
      emails.should include(@user.email)
      emails.should include('testy@tester.com')
    end

    it "refuses to save the new user when have insufficient permissions", focus: true do
      _params = { email: 'testy@tester.com', username: 'Testy',
        name: 'Testy', time_zone_code: 'US/Eastern', password: 'sweetkitties', start_date: '23-12-2014'}
      post '/api/users.json', params: _params
      response.status.should == 401
      User.count.should == 1
    end

    it "accepts a zone in the master table that no existing user has", focus: true do
      FactoryBot.create(:right_type, code: "naggable", display_label: "Naggable")
      @right_type = FactoryBot.create(:right_type, code: "create_users", display_label: "Create Users")
      @right = FactoryBot.create(:right, role_id: @user.role_id, right_type_id: @right_type.id)
      @right_target = FactoryBot.create(:right_target, right_id: @right.id, ref_obj_pk: @user.id)
      FactoryBot.create(:time_zone, code: 'US/Eastern') if TimeZone.where(code: 'US/Eastern').count == 0
      # A visible master zone that no user occupies. Before the fix this was
      # rejected because validation read DISTINCT zones from users, not this table.
      FactoryBot.create(:time_zone, code: 'Europe/Warsaw', utc_offset: 1, is_visible: true)

      _params = { email: 'warsaw@tester.com', username: 'Warsaw',
        name: 'Warsaw', time_zone_code: 'Europe/Warsaw', password: 'sweetkitties', start_date: '23-12-2014' }
      post '/api/users.json', params: _params
      response.status.should == 200
      User.find_by(email: 'warsaw@tester.com').time_zone_code.should == 'Europe/Warsaw'
    end

    it "rejects a zone that is not in the master table", focus: true do
      FactoryBot.create(:right_type, code: "naggable", display_label: "Naggable")
      @right_type = FactoryBot.create(:right_type, code: "create_users", display_label: "Create Users")
      @right = FactoryBot.create(:right, role_id: @user.role_id, right_type_id: @right_type.id)
      @right_target = FactoryBot.create(:right_target, right_id: @right.id, ref_obj_pk: @user.id)
      FactoryBot.create(:time_zone, code: 'US/Eastern') if TimeZone.where(code: 'US/Eastern').count == 0

      _params = { email: 'mars@tester.com', username: 'Mars',
        name: 'Mars', time_zone_code: 'Mars/Olympus', password: 'sweetkitties', start_date: '23-12-2014' }
      post '/api/users.json', params: _params
      response.status.should == 400
      User.find_by(email: 'mars@tester.com').should be_nil
    end

    it "accepts a zone that exists in the master table even when hidden", focus: true do
      FactoryBot.create(:right_type, code: "naggable", display_label: "Naggable")
      @right_type = FactoryBot.create(:right_type, code: "create_users", display_label: "Create Users")
      @right = FactoryBot.create(:right, role_id: @user.role_id, right_type_id: @right_type.id)
      @right_target = FactoryBot.create(:right_target, right_id: @right.id, ref_obj_pk: @user.id)
      FactoryBot.create(:time_zone, code: 'US/Eastern') if TimeZone.where(code: 'US/Eastern').count == 0
      # Validation mirrors the FK (any zone in the table), so is_visible = false
      # is still a valid value even though the dropdown would not offer it.
      FactoryBot.create(:time_zone, code: 'Pacific/Niue', utc_offset: -11, is_visible: false)

      _params = { email: 'niue@tester.com', username: 'Niue',
        name: 'Niue', time_zone_code: 'Pacific/Niue', password: 'sweetkitties', start_date: '23-12-2014' }
      post '/api/users.json', params: _params
      response.status.should == 200
      User.find_by(email: 'niue@tester.com').time_zone_code.should == 'Pacific/Niue'
    end
  end

  describe "PUT /users/:id (edit time zone)" do
    it "updates the zone when it exists in the master table", focus: true do
      FactoryBot.create(:time_zone, code: 'US/Eastern') if TimeZone.where(code: 'US/Eastern').count == 0
      FactoryBot.create(:time_zone, code: 'Europe/Warsaw', utc_offset: 1, is_visible: true)
      user = FactoryBot.create(:user)

      put "/api/users/#{user.id}", params: {
        user_id: user.id, user_entity: { time_zone: 'Europe/Warsaw' }.to_json }
      response.status.should == 200
      user.reload.time_zone_code.should == 'Europe/Warsaw'
    end

    it "rejects an unknown zone and leaves the existing zone unchanged", focus: true do
      FactoryBot.create(:time_zone, code: 'US/Eastern') if TimeZone.where(code: 'US/Eastern').count == 0
      user = FactoryBot.create(:user) # seeded with US/Eastern

      put "/api/users/#{user.id}", params: {
        user_id: user.id, user_entity: { time_zone: 'Mars/Olympus' }.to_json }
      response.status.should == 400
      user.reload.time_zone_code.should == 'US/Eastern'
    end
  end

  describe "PUT /users/:id/disable" do
    it "disables a user in database", focus: true do
      user = FactoryBot.build(:user)
      role = FactoryBot.create(:role)
      user.role = role
      user.save!
      _params = { id: user.id, status_code: 'disabled' }
      put "/api/users/#{user.id}/disable" , params: _params
      response.status.should == 200
      User.where(status_code: 'disabled').count.should == 1
    end
  end

  describe "GET /users/all_roles.json" do
    it "get list of users" do
      user = FactoryBot.build(:user)
      role = FactoryBot.create(:role)
      user.role = role
      user.save!
      get '/api/users/all_roles.json'
      response.should be_successful
      body = JSON.parse(response.body)
      body.should be_an(Array)
      emails = body.map { |u| u['email'] }
      emails.should include(@user.email)
      emails.should include(user.email)
    end

    it "renders the #all_roles view" do
      user = FactoryBot.build(:user)
      role = FactoryBot.create(:role)
      user.role = role
      user.save!
      get '/api/users/all_roles.json'
      response.should render_template :all_roles
    end
  end

  describe "GET /users/current.json" do
    it "checks current user" do
      get '/api/users/current.json'
      response.should be_successful
      body = JSON.parse(response.body)
      body['email'].should eq(@user.email)
    end

    it "renders the #current view" do
      get '/api/users/current.json'
      response.should render_template :current
    end
  end

  describe "GET /users/:user_id.json" do
    it "returns the requested user's details" do
      user = FactoryBot.create(:user)

      get "/api/users/#{user.id}.json"

      response.should be_successful
      body = JSON.parse(response.body)
      body['id'].should eq(user.id)
      body['email'].should eq(user.email)
    end
  end

  describe "POST /users/assume.json" do
    it "limits who can switch roles to those with the right" do
      switched_user = FactoryBot.create(:user,
                                         password: "correct",
                                         password_confirmation: "correct")
      expect(@user.can_switch_roles).to be_falsey
      post '/api/users/assume.json', params: {  email: switched_user.email }
      session[:assume_role_id].should be_nil
      logout_sucessfully

      super_user = FactoryBot.create(:user,
                                      email: "root@endpointdev.com",
                                      password: "correct",
                                      password_confirmation: "correct")
      grant_superuser
      login_sucessfully(super_user.email)
      expect(super_user.can_switch_roles).to be_truthy
      post '/api/users/assume.json', params: {  email: switched_user.email }
      session[:assume_role_id].should eq(switched_user.role.id)
    end

    it "allows switching back to yourself" do
      super_user    = FactoryBot.create(:user,
                                         email: "root@endpointdev.com",
                                         password: "correct",
                                         password_confirmation: "correct")
      grant_superuser
      switched_user = FactoryBot.create(:user,
                                         password: "correct",
                                         password_confirmation: "correct")
      expect(super_user.can_switch_roles).to be_truthy
      post '/api/users/assume.json', params: {  email: switched_user.email }
      session[:assume_role_id].should eq(switched_user.role.id)
      post '/api/users/assume.json', params: {  email: super_user.email }
      session[:assume_role_id].should eq(super_user.role.id)
    end

  end
end
