namespace :front do
  task :update_version do
    `uuidgen -r > public/front.version`
  end
end
