require 'spec_helper'

# /client_log accepted any text from anyone, logged in or not, and appended it
# to a file on disk with no size cap, no rate limit and no rotation. Its only
# caller was the AngularJS frontend (public/scripts/lib/appRun.js), removed in
# 0fbf351, so it sat there writing to disk for nobody.
#
# This pins the removal. Bringing the endpoint back means bringing back an
# unauthenticated write primitive, so it should be a deliberate act that fails
# a test first.
describe "The client_log endpoint" do
  it "no longer has a route" do
    expect {
      Rails.application.routes.recognize_path("/api/client_log", method: :post)
    }.to raise_error(ActionController::RoutingError)
  end

  it "no longer has a controller" do
    defined?(ClientLogController).should be_nil
  end
end
