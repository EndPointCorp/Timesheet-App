require 'singleton'

class Settings
  include Singleton

  def client
    {
      work_chart_root_id: WORK_CHART_ROOT_ID,
      work_chart_clients_id: WORK_CHART_CLIENTS_ID,
      team_role_id: TEAM_ROLE_ID
    }
  end
end
