class RightType < ActiveRecord::Base
  self.table_name = :right_types

  belongs_to :right,
    class_name: 'Right',
    foreign_key: :right_id

  # At least when you'll misspell typ code in constant
  # you'll se an exception
  SWITCH_USER            = "switch_user"
  SUPERUSER              = "superuser"
  ACCESS_SITE_MANAGEMENT = "access_site_mgmt"
  REPORT                 = "report"
  MANAGE                 = "manage"
  BILL                   = "bill"
  ACCESS_CONTROL         = "access_control"
  NAGGABLE               = "naggable"
  ACCOUNT_OVERVIEW       = "accounts_overview"
  VIEW_ACCOUNT           = "view_account"
  EDIT_ACCOUNT           = "edit_account"
  EXECUTE                = "execute"
  CREATE_USERS           = "create_users"
  REPRESENT              = "represent"
  PROJECT_MANAGE         = "project_manage"
  GET_NAG_EMAILS_FOR_PROJECT_MANAGER     = "get_nag_emails_for_project_manager"
  GET_NAG_EMAILS_FOR_TEAM     = "get_nag_emails_for"
  MANAGER                = "manage_team"
  GLOBAL_REVIEWER        = "global_reviewer"
  NEWFEATURESTESTER      = "new_features_tester"
end
