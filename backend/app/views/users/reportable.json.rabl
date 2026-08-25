collection @roles
attributes :email, :status_code
node :display_label do |user|
  user.role.display_label
end
