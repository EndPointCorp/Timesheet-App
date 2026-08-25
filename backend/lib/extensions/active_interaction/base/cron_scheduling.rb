module Extensions
  module ActiveInteraction
    module Base
      module CronScheduling

          def every(hash_cron_spec)
            cron_spec = CronSpec.new(hash_cron_spec)
            ScheduledInteraction.new(cron_spec, self.name)
          end

          class ScheduledInteraction
            attr_accessor :cron_spec, :task_name

            def initialize(cron_spec, task_name)
              @cron_spec = cron_spec
              @task_name = task_name
            end

            def run!(hash_arguments = {})
              run hash_arguments
            end

            def run(hash_arguments = {})
              CronJob.schedule! @cron_spec, @task_name,
                hash_arguments
            end
          end

      end
    end
  end
end
