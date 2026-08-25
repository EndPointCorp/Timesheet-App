class Reports::SendProjectReports < ActiveInteraction::Base
  symbol :mode, default: :last_day
  object :report_type, class: Class, default: Report::Standard
  boolean :include_descriptions, default: false
  string :fragmentation, default: 'continuous'
  array :bcc, default: [] do
    string
  end

  validates :mode, inclusion: { in: [ :last_day, :this_week, :last_week, :this_month, :last_month ] }
  validates :report_type, inclusion: { in: [
      Report::Billing,
      Report::BillingAtLeaf,
      Report::Standard,
      Report::Break,
      Report::ByUser
    ]
  }
  validates :fragmentation, inclusion: { in: [ 'continuous', 'weekly', 'monthly', 'quaterly' ] }

  def execute
    work_charts.each do |work_chart|
      doc_params = report_params(work_chart)
      document = report_type.by_params doc_params
      if !work_chart.dont_send_empty_reports || document.total_time.minutes > 0
        work_chart.project_managers.each do |user|
          html = ReportPresenter.html_for(doc_params, document, report_type, user, :email)
          text = ReportPresenter.text_for(doc_params, document, report_type, user, :email)

          mail = GenericMailer.email(to: user.email, bcc: bcc,
                              subject: "[#{root_label(work_chart)}] Work Report",
                              html: html, text: text, return_path: '<>',
                              reply_to: '<>',
                              headers: {
                                'Precedence' => 'list',
                                return_path: '<>'
                              }
                            )
          mail.deliver_later
        end
      end
    end
  end

  def work_charts
    WorkChart.project_managed.active
  end

  def root_label(work_chart)
    ChartLabel.find(work_chart.id).labels[1..100].join(' - ')
  end

  def report_start
    case mode
      when :last_day then 1.day.ago
      when :last_week then 0.days.ago.prev_week
      when :this_week then 0.days.ago.beginning_of_week
      when :last_month then 0.days.ago.prev_month
      when :this_month then 0.days.ago.beginning_of_month
    end
  end

  def report_end
    case mode
      when :last_day then 0.days.ago
      when :last_week then 0.days.ago.prev_week  + 6.days
      when :this_week then 0.days.ago
      when :last_month then 0.days.ago.beginning_of_month - 1.day
      when :this_month then 0.days.ago
    end
  end

  def users_lens_for(work_chart_id)
    users_lens.work_chart_id = work_chart_id
    users_lens
  end

  def report_params(work_chart)
    {
      start_date: report_start.to_date,
      end_date:   report_end.to_date,
      roles: [],
      work_chart_id: work_chart.id,
      description: include_descriptions,
      fragmentation: fragmentation,
      full_rights: true
    }
  end
end
