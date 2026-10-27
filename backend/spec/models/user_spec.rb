require 'spec_helper'

describe User do

  before(:each) do
    FactoryBot.create :right_type_target_kind unless RightTypeTargetKind.find_by_code 'user'
    FactoryBot.create :user_status, code: 'enabled'
    FactoryBot.create :time_zone, code: 'US/Eastern'
  end

  it "has a valid factory" do
    FactoryBot.build(:user).should be_valid
  end

  describe "USERNAME_FORMAT" do
    # The format is checked in Ruby so the admin gets a message, but the users
    # table has the final say. If the table's rule changes, this fails.
    it "accepts and rejects the same names as the users table" do
      connection = ActiveRecord::Base.connection
      definition = connection.select_value(
        "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'users_username_check'")
      table_pattern = Regexp.new(definition[/~ '([^']+)'/, 1])
      table_limit = User.columns_hash['username'].limit

      samples = ['ab', 'abc', 'a' * 30, 'a' * 31, 'a', '', 'ab1', 'a-b', 'a.b', 'a_b', 'a b', 'AB', 'Ab']
      samples.each do |name|
        table_accepts = table_pattern.match?(name) && name.length <= table_limit
        User::USERNAME_FORMAT.match?(name).should eq(table_accepts), "differs for #{name.inspect}"
      end
    end
  end

  describe "#can_edit_charts" do
    it "returns true if user's immediate role has superuser in its rights collection" do
      @user = FactoryBot.create :user_with_immediate_superuser
      @user.can_edit_charts.should eq(true)
    end
    it "returns true if some of user's non-immediate roles has superuser in its rights collection" do
      @user = FactoryBot.create :user_with_nonimmediate_superuser
      @user.can_edit_charts.should eq(true)
    end
    it "returns false if non of user's roles has superuser in its rights collection" do
      @user = FactoryBot.create :user
      @user.can_edit_charts.should_not eq(true)
    end
  end

end
