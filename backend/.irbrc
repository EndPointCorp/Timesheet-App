IRB.conf[:USE_READLINE] = true
IRB.conf[:AUTO_INDENT]  = false

IRB.conf[:SAVE_HISTORY] = 1000
IRB.conf[:HISTORY_FILE] = "#{Rails.root}/tmp/.irb-save-history"

ActiveRecord::Base.logger = Logger.new(STDOUT)

module DynamicPrompt
  def self.apply!
    IRB.conf[:PROMPT][:INFORMATIVE] = {
      :PROMPT_I => ">>".tap {|s| def s.dup; gsub('>>', DynamicPrompt.normal); end },
      :PROMPT_S => "\e[0;35m%n\e[0m   ",
      :PROMPT_C => "\e[0;35m%n\e[0m>   ",
      :RETURN => "\e[1;35m=>\e[0m %.2048s\n"
    }
    IRB.conf[:PROMPT_MODE]  = :INFORMATIVE
  end

  def self.normal
    color1 = "\e[0;35m%n \e[35m[\e[1;35m"
    color2 = "\e[0;35m]::\e[1;34m"
    color3 = "\e[0;35m]\e[0m> "
    color1 + current_ruby + " -> rails " + rails + color2 + cwd + color3 
  end

private
  def self.current_ruby
    @@current_ruby ||= `ruby -v | awk '{ print $1 " " $2 }'`.strip
  end

  def self.rails
    Rails.version
  end

  def self.cwd
    if Dir.pwd == '/'
      '/'
    elsif Dir.pwd == ENV['HOME']
      '~'
    else
      Dir.pwd.split('/').last
    end
  end
end

DynamicPrompt.apply!
