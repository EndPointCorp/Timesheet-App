Dir["#{Rails.root}/lib/*.rb"].each {|file| require file }
Dir["#{Rails.root}/lib/extensions/active_interaction/base/*.rb"].each {|file| require file }
