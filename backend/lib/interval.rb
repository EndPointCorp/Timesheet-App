# class handling interval data type found in PostgreSql
class Interval
  include Comparable

  attr_accessor :minutes

  def initialize(interval = "00:00:00")
    if interval.class == String
      hours, minutes = interval.split(":")
      sign = hours[0] == "-" ? -1 : 1
      @minutes = (minutes.to_i + hours.to_i.abs * 60) * (hours.to_i != 0 ? (hours.to_i / hours.to_i.abs) : sign)
    elsif interval.class == DateTime
      @minutes = interval.min
      @minutes += interval.hour * 60
    elsif interval.class == Integer
      @minutes = interval
    elsif interval.class == Interval
      @minutes = interval.minutes
    else
      @minutes = 0
    end
  end

  def +(right)
    i = Interval.new
    i.minutes = self.minutes + right.minutes
    i
  end

  def -(right)
    i = Interval.new
    i.minutes = self.minutes - right.minutes
    i
  end

  def <=>(other)
    @minutes <=> other.minutes
  end

  def to_json(dummy = nil)
    @minutes.to_json
  end

  def to_interval_string
    "#{self.clock_hours}:#{self.clock_minutes}:00"
  end

  def clock_minutes
    @minutes.abs - self.clock_hours * 60
  end

  def clock_hours
    @minutes.abs / 60
  end

  def to_s
    sign = @minutes >= 0 ? "" : "-"
    "#{sign}#{self.clock_hours}:#{self.clock_minutes}:00"
  end

  def to_human_s
    (self.clock_hours.to_f + self.clock_minutes.to_f / 60).to_s
  end

end
