# Returns the effective user, with the exception of the :email attribute, which is the current logged-in user.
# The :as node contains the effective username, if applicable
object @current_user
attributes :email
node :can_switch_roles do
  @effective_user.can_switch_roles
end
node :code do
  @effective_user.role.code
end
node :id do
  @effective_user.id
end
node :is_admin do
  @effective_user.is_admin?
end
node :can_create_users do
  @effective_user.can_create_users?
end
node :can_edit_charts do
  @effective_user.can_edit_charts
end
node :is_manager do
  @effective_user.is_manager?
end
node :is_director do
  @effective_user.is_director?
end
node :is_new_features_tester do
  @effective_user.is_new_features_tester?
end
node :as do
  if current_user != @effective_user
    @effective_user.role.display_label
  else
    nil
  end
end
node :assumed_email do
  if current_user != @effective_user
    @effective_user.email
  else
    nil
  end
end
