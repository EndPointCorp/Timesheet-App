require 'spec_helper'

describe HomeController do

  describe "GET 'index'" do
    # The action renders the compiled React entry point (frontend/index.html),
    # a build artifact that is gitignored and absent from a backend-only
    # checkout. Drop in a stand-in so we exercise the real render/route wiring,
    # and only clean up the copy we created (never a real build).
    let(:frontend_index) { Rails.root.join('frontend', 'index.html') }

    before(:each) do
      FactoryGirl.create :work_chart

      unless File.exist?(frontend_index)
        @created_frontend_index = true
        FileUtils.mkdir_p(frontend_index.dirname)
        File.write(frontend_index, "<!DOCTYPE html><html><body>test</body></html>")
      end
    end

    after(:each) do
      next unless @created_frontend_index
      File.delete(frontend_index) if File.exist?(frontend_index)
      dir = frontend_index.dirname
      Dir.rmdir(dir) if Dir.exist?(dir) && Dir.empty?(dir)
    end

    it "returns http success" do
      get 'index'
      response.should be_success
    end
  end

end
