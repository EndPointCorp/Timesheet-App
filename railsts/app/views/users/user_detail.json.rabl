object @user_detail

attributes :id, :email, :name, :role_id,
  :status_code, :time_zone, :team_ids, :role_ids, :direct_role_ids

node :myrights do |user_detail|
  user_detail.direct_rights + user_detail.indirect_rights
end
