require "spec_helper"

# The company addresses are settings, not code, so another organization can
# run the app without editing it. These specs check the app follows the
# settings.
describe "configured email addresses" do
  # Sets a setting for one example and puts the old value back after.
  def with_setting(name, value)
    old = Object.const_get(name)
    Object.send(:remove_const, name)
    Object.const_set(name, value)
    yield
  ensure
    Object.send(:remove_const, name)
    Object.const_set(name, old)
  end

  it "sends mail from the sender in the settings" do
    expect(ApplicationMailer.default_params[:from]).to eq(MAILER_FROM_EMAIL)
  end

  it "finds a user by name in the configured domain" do
    with_setting("EMAIL_DOMAIN", "corp.test") do
      user = FactoryBot.create :user, email: "ann@corp.test"
      expect(User.by_name("ann")).to eq(user)
    end
  end

  it "hides the configured system accounts from the user details" do
    with_setting("SYSTEM_ACCOUNT_EMAILS", ["robot@corp.test"]) do
      FactoryBot.create :user, email: "robot@corp.test"
      person = FactoryBot.create :user, email: "ann@corp.test"
      emails = UserDetail.all.map(&:email)
      expect(emails).to include(person.email)
      expect(emails).not_to include("robot@corp.test")
    end
  end
end
