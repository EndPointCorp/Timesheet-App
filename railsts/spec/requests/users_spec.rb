require 'spec_helper'

describe "Users" do
  before(:each) do
    @user = create_correct_user
    login_sucessfully
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
      users = User.order("username ASC")
      get '/api/users/all_roles.json'
      response.should be_successful
      assigns(:all_roles).map(&:id).should eq(users.map(&:id))
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
      assigns(:current_user).email.should eq(@user.email)
    end

    it "renders the #current view" do
      get '/api/users/current.json'
      response.should render_template :current
    end
  end

  describe "GET /users/:id.json" do
    it "assigns the requested user to @user" do
      user = FactoryBot.build(:user)
      get "/api/users/#{user.id}"
      response.should be_successful
      assigns(:id).should eq(user.id)
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
