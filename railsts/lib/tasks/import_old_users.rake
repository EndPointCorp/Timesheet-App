require "haddock"
include Haddock

namespace :import do
  task old_users: :environment do
    IC::User.enabled.each do |old_user|
      if User.where(email: old_user.email).count == 0
        password = Password.generate
        User.create! email: old_user.email, password: password, password_confirmation: password, role_id: old_user.role_id
        puts "User #{old_user.email} created with password '#{password}'"
      else
        puts "Skipping user #{old_user.email}"
      end
    end
  end
end
