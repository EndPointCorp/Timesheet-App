class ReportLog
  def self.debug(message=nil)
    @report_log ||= Logger.new("#{Rails.root}/log/report.log")
    @report_log.debug(message) unless message.nil?
  end
end


