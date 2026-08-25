# pseudo model holding info about report item
class ReportItem < ActiveRecord::Base
  self.table_name = :report_items

  def kind_codes
    unless @kind_codes
      if self.attributes.keys.include? 'duration_kind_codes'
        @kind_codes = self.duration_kind_codes
      else
        raise "ReportItem#kind_codes can't be used if the query didn't include duration_kind_codes column"
      end
    end
    @kind_codes
  end

end
