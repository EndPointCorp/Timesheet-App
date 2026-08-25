class ProcessQuery
  def self.pid_path_active?(pid_path)
    pid = File.read pid_path
    system "kill -0 #{pid}"
    return $? == 0
  rescue
    false
  end
end
