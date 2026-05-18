require 'spec_helper'

describe User do

  before(:each) do
    FactoryGirl.create :right_type_target_kind unless RightTypeTargetKind.find_by_code 'user'
    FactoryGirl.create :user_status, code: 'enabled'
    FactoryGirl.create :time_zone, code: 'US/Eastern'
  end

  it "has a valid factory" do
    FactoryGirl.build(:user).should be_valid
  end

  describe "#can_edit_charts" do
    it "returns true if user's immediate role has superuser in its rights collection" do
      @user = FactoryGirl.create :user_with_immediate_superuser
      @user.can_edit_charts.should eq(true)
    end
    it "returns true if some of user's non-immediate roles has superuser in its rights collection" do
      @user = FactoryGirl.create :user_with_nonimmediate_superuser
      @user.can_edit_charts.should eq(true)
    end
    it "returns false if non of user's roles has superuser in its rights collection" do
      @user = FactoryGirl.create :user
      @user.can_edit_charts.should_not eq(true)
    end
  end

end
