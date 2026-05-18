# Controller serving main front app files in case that they aren't served by nginx
# as statics
class HomeController < ApplicationController

  # GET /
  def index
    # Read the React app's `index.html` from the `frontend` folder
    render file: File.join(Rails.root, 'frontend', 'index.html'), layout: false
  end
end
