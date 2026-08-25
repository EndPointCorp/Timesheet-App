class CronSpec
  attr_accessor :minutes, :hours, :day_of_month, :month, :day_of_week, :year

  class << self
    def load(spec)
      return nil if spec.nil?
      self.new(*(spec.gsub(/\(|\)/, '').split(',').map { |i| i.empty? ? nil : i.to_i }))
    end

    def dump(obj)
      "(#{obj.to_a.join(',')})"
    end

    def empty
      self.new nil
    end
  end

  def to_s
    [ :minutes, :hours, :day_of_month, :month, :day_of_week, :year ].map do |part|
      self.send(part) || "*"
    end.join " "
  end

  def initialize_for_hash(hash)
    hash.keys.each do |a|
      raise ArgumentError, "'#{a}' is not part of the CronSpec" if !CronSpec.attrs.include?(a.to_s)
    end

    @minutes = hash[:minutes]
    @hours = hash[:hours]
    @day_of_month = hash[:day_of_month]
    @month = hash[:month]
    @day_of_week = hash[:day_of_week]
    @year = hash[:year]
  end

  def initialize(minutes = nil, hours = nil, day_of_month = nil, month = nil, day_of_week = nil, year = nil)
    if minutes.is_a? Hash
      initialize_for_hash(minutes)
    else
      @minutes = minutes
      @hours = hours
      @day_of_month = day_of_month
      @month = month
      @day_of_week = day_of_week
      @year = year
    end
  end

  def dates_since(date)
    _start_year = @year || date.year
    _start_month = @month || date.month
    _start_day = @day_of_month || date.day
    _start_hour = @hours || date.hour
    _start_minute = @minutes || date.minute

    _date = DateTime.new _start_year, _start_month, _start_day,
      _start_hour, _start_minute

    1.upto(Float::INFINITY).lazy.map do |iter|
      _date += minimal_interval
    end.select do |_d|
      res = matches? _d
      res
    end
  end

  def matches?(date)
    return false if !@minutes.nil? and 
      date.minute != @minutes

    return false if !@hours.nil? and 
      date.hour != @hours

    return false if !@day_of_month.nil? and 
      date.day != @day_of_month

    return false if !@month.nil? and 
      date.month != @month

    return false if !@year.nil? and 
      date.year != @year

    return false if !@day_of_week.nil? and 
      date.to_date.wday != @day_of_week

    return true
  end

  def minimal_interval
    if @minutes.nil?
      1.minute
    else
      1.hour
    end
  end

  def empty?
    to_a.all?(&:nil?)
  end

  def as_json(config = nil)
    {
      minutes: @minutes,
      hours: @hours,
      day_of_month: @day_of_month,
      month: @month,
      day_of_week: @day_of_week,
      year: @year
    }
  end

  def self.attrs
    [ 'minutes', 'hours', 'day_of_month', 'month', 'day_of_week', 'year']
  end

  def to_a
    [ @minutes, @hours, @day_of_month, @month, @day_of_week, @year ]
  end
end
