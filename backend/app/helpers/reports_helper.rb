module ReportsHelper
  def format_interval_string(interval_string)
    number_with_precision(interval_string, precision: 2, delimiter: ',')
  end
end
