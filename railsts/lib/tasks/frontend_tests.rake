namespace :frontend do
  desc "Runs headless WebKit based front end tests"
  task :test do
    pwd = Dir.pwd
    Dir.chdir File.join(Rails.root, "front-end")
    puts "Compiling and testing:"
    exec "./bin/brunch b; ./bin/mocha-phantomjs ./public/test.html -s loadImages=false"
    Dir.chdir pwd
  end
end
