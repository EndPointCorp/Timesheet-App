namespace :activate do
  desc "Assures all active workcharts are set to active"
  task workcharts: :environment do

    ids = WorkChart.joins(:work_entries).where('work_entries.last_modified > ? AND status = ?', 1.day.ago, 'hidden').map(&:id).uniq
      charts = WorkChart.find(ids).each do |a|
        WorkChart.where(id: a.up_path_ids).each { |ap| ap.activate! }
      end
  end
end
