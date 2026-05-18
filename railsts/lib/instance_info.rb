class InstanceInfo
  def self.base_url
    base = "timesheet.endpointdev.com"
    if in_camp?
      "https://#{camp_number}.camp.#{base}:#{camp_port}"
    else
      "https://#{base}"
    end
  end

  def self.in_camp?
    !camp_number.nil?
  end

  def self.camp_number
    `pwd`[/(?<=camp)\d+/]
  end

  def self.camp_port
    "91#{camp_number.rjust(2, '0')}" if in_camp?
  end
end
