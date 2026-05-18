class System::TickCron < ActiveInteraction::Base
  def execute
    CronJob.with_advisory_lock('cron_jobs') do
      CronJob.current.each do |job|
        begin
          job.task_name.constantize.run!(job.interaction_arguments)
        rescue => error
          # TODO: Implement exception notification
          Rails.logger.info "Exception Email sent? #{res} #{error}"
        end
      end
    end
  end
end
