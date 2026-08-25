class CronJob < ActiveRecord::Base
  serialize :recur_at, coder: CronSpec

  def self.current
    joins("INNER JOIN current_cron_jobs on current_cron_jobs.id = cron_jobs.id").
      select("cron_jobs.*")
  end

  def self.schedule!(cron_spec, task_name, hash_arguments)
    arguments = JsonMarshal.dump hash_arguments
    CronJob.create! recur_at: cron_spec,
      task_name: task_name,
      arguments: {
        dump: arguments
      }
  end

  def interaction_arguments
    @_interaction_arguments ||= JsonMarshal.load(arguments["dump"])
  end

  private

  class Current < ActiveRecord::Base
    self.table_name = :current_cron_jobs
  end
end
