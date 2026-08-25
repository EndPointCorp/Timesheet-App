class ChartNotifierConfig
  attr_accessor :chart_id, :mode, :with_description, :recipients, :condition, :report_type
  
  # report_type: :break | :by_category | :by_user | :standard
  # mode: :from_selected | :children | :all


  def self.from_disc
    array = []
    $/="\n\n"
    File.open(Rails.root.join("config", "chart_notifier.yml"), "r").each do |object| 
      array << YAML::load(object)
    end
    array
  end

  def write
    File.open(Rails.root.join("config", "chart_notifier.yml"), "w") do |file|  
      file.puts YAML::dump(self)    
      file.puts ""
    end
  end

  class Condition
    attr_accessor :hour, :week_days, :threshold

    class Threshold
      attr_accessor :mode, :value

      # mode: :this_month | :last_day | :this_week
    end
  end
end
