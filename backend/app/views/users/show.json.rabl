object @user
attributes :id, :email, :status_code, :time_zone_code
node :name do |user|
  if user.role.user
    user.role.user.name
  else
    ""
  end
end
node :username do |user|
  user.username.capitalize
end
