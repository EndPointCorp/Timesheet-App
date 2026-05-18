class BaselineHoursConfig
  attr_accessor :work_chart_id, :hours, :include_nonbillables, :days

  def self.from_disc
    array = []
    $/="\n\n"
    File.open(Rails.root.join("config", "baseline_hours.yml"), "r").each do |object|
      array << YAML::load(object)
    end
    array
  end

  def write
    File.open(Rails.root.join("config", "baseline_hours.yml"), "w") do |file|  
      file.puts YAML::dump(self)    
      file.puts ""
    end
  end

end
