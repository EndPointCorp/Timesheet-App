require 'spec_helper'

describe Role do

  before(:each) do
    FactoryBot.create :right_type_target_kind unless RightTypeTargetKind.find_by_code 'user'
    FactoryBot.create :user_status, code: 'enabled'
    FactoryBot.create :time_zone, code: 'US/Eastern'
  end

  it "has a valid factory" do
    FactoryBot.build(:role).should be_valid
  end

  describe "#has_right_to" do
    it "returns true to checking for switch user right if user has 'superuser' in his immediate rights" do
      @role = FactoryBot.create :role_with_immediate_superuser
      @users = FactoryBot.create_list :user, 5
      @users.each do |user|
        @role.has_right_to(RightType::SWITCH_USER, user).should eq(true)
      end
    end

    it "returns true to check for switch user if user has this right" do
      @role = FactoryBot.create :role
      @users = FactoryBot.create_list :user, 5
      @switch_right = FactoryBot.build :right, role_id: @role.id
      @switch_right.right_type = FactoryBot.build :right_type, code: RightType::SWITCH_USER
      @users[0..-2].each do |user|
        @switch_right.targets << FactoryBot.build(:right_target, ref_obj_pk: user.id.to_s)
      end
      @switch_right.save!
      @users[0..-2].each do |user|
        @role.has_right_to(RightType::SWITCH_USER, user).should eq(true)
      end
      @role.has_right_to(RightType::SWITCH_USER, @users.last).should eq(false)
    end
  end

end
