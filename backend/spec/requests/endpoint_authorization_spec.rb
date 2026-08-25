require 'spec_helper'

# The ptos, work_months and work_days endpoints accept a :username and return
# that person's data. Seeing someone else's timesheet is a real feature - a
# manager reviewing their team - so the fix was a rights check, not a removal.
#
# These specs pin both halves, because only pinning one invites the other to
# come back: the feature has to keep working, and the hole has to stay shut.
describe "Authorisation on endpoints that accept a :username" do
  before(:each) do
    @user = create_correct_user
    login_sucessfully
    @user.role.update_columns(code: "user_me")

    @other = FactoryBot.create :user
    @other.role.update_columns(code: "user_other")
  end

  # Every endpoint that takes the parameter. Adding one here is how a new
  # endpoint gets covered without anyone having to remember to write specs.
  def paths_for(username)
    [
      "/api/ptos.json?username=#{username}",
      "/api/work_months/2026-01-01/2026-08-01.json?username=#{username}",
      "/api/work_days/calendar/2026/7.json?username=#{username}",
    ]
  end

  context "when the caller has no right to see the other user" do
    it "refuses all of them" do
      paths_for("other").each do |path|
        get path
        response.status.should(eq(401), "expected 401 for #{path}, got #{response.status}")
      end
    end
  end

  context "when the caller may report on the other user" do
    it "returns the data, so a manager reviewing their team still works" do
      set_rights_on_user_for 'report', @other, true

      paths_for("other").each do |path|
        get path
        response.status.should(eq(200), "expected 200 for #{path}, got #{response.status}")
      end
    end
  end

  it "always lets the caller see their own data" do
    (paths_for("me") + ["/api/ptos.json"]).each do |path|
      get path
      response.status.should(eq(200), "expected 200 for #{path}, got #{response.status}")
    end
  end

  # A different status for "no such user" would let anyone confirm which
  # accounts exist just by asking.
  it "answers an unknown username exactly as it answers a refused one" do
    get "/api/ptos.json?username=other"
    refused = response.status

    get "/api/ptos.json?username=nosuchperson"
    response.status.should eq(refused)
  end
end
