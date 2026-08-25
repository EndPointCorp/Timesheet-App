class Pto
  def self.rundown_for(user, date)
    new(user, date).rundown
  end

  def rundown
    {
      anniversary:          @user.start_date.strftime("%m-%d"),
      cal_year:             @today.year,
      last_cal_year:        @today.year.to_i - 1,
      holiday:              @user.holiday_total_by_year(beginning_of_calendar_year, end_of_calendar_year) || 0,
      last_year_holiday:    @user.holiday_total_by_year(beginning_of_last_calendar_year, end_of_last_calendar_year) || 0,
      vacations:            @user.vacation_total_by_year(last_aniversary, last_aniversary + 1.year) || 0,
      last_year_vacation:   @user.vacation_total_by_year(two_years_ago_aniversary, last_aniversary - 1.day) || 0,
      sicks:                @user.sick_total_by_year(last_aniversary, last_aniversary + 1.year) || 0,
      last_year_sicks:      @user.sick_total_by_year(two_years_ago_aniversary, last_aniversary - 1.day) || 0,
      last_aniversary_year: last_aniversary.year
    }
  end

  private

  def beginning_of_calendar_year
    DateTime.new(@today.year, 1, 1)
  end

  def beginning_of_last_calendar_year
    beginning_of_calendar_year - 1.year
  end

  def end_of_last_calendar_year
    beginning_of_calendar_year - 1.day
  end

  def end_of_calendar_year
    DateTime.new(@today.year, 12, 31)
  end

  def last_aniversary
    @_last_aniversary ||= if @today < this_year_aniversary
      this_year_aniversary - 1.year
    else
      this_year_aniversary
    end
  end

  def two_years_ago_aniversary
    last_aniversary - 1.year
  end

  def this_year_aniversary
    @_this_year_aniversary ||= DateTime.new(@today.year, @user.hire_date.month, @user.hire_date.day)
  end

  def initialize(user, date)
    @user = user
    if date.year == 0
      @today = DateTime.new(1995, 1, 1)
    else
      @today = date
    end
  end
end
