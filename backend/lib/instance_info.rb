class InstanceInfo
  def self.base_url
    # Containerized deploys set APP_HOST (the public FQDN); the camp working
    # directory heuristics below only apply to legacy DevCamp hosts.
    return "https://#{ENV['APP_HOST']}" if ENV["APP_HOST"].present?

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
