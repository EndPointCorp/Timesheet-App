Dir[Rails.root + 'app/models/**/*.rb'].each do |path|
  require path
end

module CleanDatabase
  def destroy_all_objects
    Rails.application.eager_load!
    tables = ActiveRecord::Base.connection.tables
    tables.uniq.each do |table|
      if ActiveRecord::Base.connection.data_source_exists? table
        ActiveRecord::Base.connection.execute("TRUNCATE #{table} RESTART IDENTITY CASCADE")
      end
    end
  end

  def create_dictionaries
    FactoryGirl.create(:right_type, code: 'billable')
    FactoryGirl.create(:right_type, code: 'naggable')
  end
end

class Cleaner
  include CleanDatabase
end
