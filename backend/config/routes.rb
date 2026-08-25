TimesheetApp::Application.routes.draw do
scope '/api' do

  get "team/totals"
  get "team/teams"

  # approvals related routes
  patch "/approvals/:id" => "approvals#update", as: :update_approval
  patch "/approvals" => "approvals#batch_update", as: :batch_update_approvals
  get "/approvals" => "approvals#index", as: :approvals
  get "/approvals/stats" => "approvals#stats", as: :approvals_stats
  post "/approvals/undo_last" => "approvals#undo_last", as: :undo_approval

  # Work days related routes
  get "/work_days/calendar/:year/:month" => "work_days#calendar", as: :calendar
  get "/work_days/calendar/:year/:month/:username" => "work_days#calendar"

  # Work months related routes
  get "/work_months/(:start)/(:end)" => "work_months#index",
      constraints: { start: /\d{4}-\d{2}-\d{2}/, end: /\d{4}-\d{2}-\d{2}/ },
      as: "work_months"
  get "/work_months/(:start)/(:end)/:username" => "work_months#index",
      constraints: { start: /\d{4}-\d{2}-\d{2}/, end: /\d{4}-\d{2}-\d{2}/ }

  # Work entries related routes
  resources :work_entries do
    member do
      get 'previous_next'
      post 'reclaim'
    end

    collection do
      get 'day'
    end
  end

  # Kinds related routes
  resources :duration_kinds

  # Work charts related routes
  resources :work_charts do
    collection do
      get 'search'
      get 'quicks'
      get 'able_to_be_parents'
      get 'clients'
    end

    member do
      get 'kinds'
      put 'update_reporting_settings'
      put 'save_durations'
      put 'clear_durations'
      get 'assigned_work_entries_count'
      get 'has_customized_set'
      get 'find_heirs' => "work_charts#find_heirs" 
      get 'select_new_chart' => "work_charts#select_new_chart"
    end
  end

  # General roles/users related routes
  get "/ptos" => "ptos#index"
  get "/ptos/:username" => "ptos#index"
  get "/time_zones" => "time_zones#index"
  post "/roles/create_role" => "roles#create_role"
  get "/roles" => "roles#all"

  # Users related routes
  get "/users" => "users#all"
  get "/users/current" => "users#current"
  get "/users/others"  => "users#others"
  get "/users/all_roles"  => "users#all_roles"
  get "/users/reportable" => "users#reportable"
  get "/users/details" => "users#details"
  get "/users/all_right_types" => "users#all_right_types"
  get "/users/all_groups_teams" => "users#all_groups_teams"
  get "/users/:user_id" => "users#details"
  post "/users" => "users#create"
  post "/users/assume"  => "users#assume", as: :assume_role
  put "/users/:id" => "users#update"
  put "/users/:id/disable" => "users#disable"

  # Groups related routes
  get "/groups" => "groups#all"
  get "/groups/details" => "groups#details"
  get "/groups/details/:id" => "groups#details"
  get "/groups/groups_no_teams" => "groups#groups_no_teams"
  get "/groups/all_teams" => "groups#all_teams"
  get "/groups/groups_with_roles" => "groups#groups_with_roles"
  post "/groups" => "groups#create"
  put "/groups/:id" => "groups#update"

  # Reports related routes
  get "/reports/break" => "reports#break"
  get "/reports/billing_at_leaf" => "reports#billing_at_leaf"
  get "/reports/billing" => "reports#billing"
  get "/reports/by_user" => "reports#by_user"
  get "/reports/standard" => "reports#standard"
  get "/reports/presets" => "reports#presets"
  post "/reports/create_preset" => "reports#create_preset"
  delete "/reports/remove_preset/:preset_id" => "reports#remove_preset"

  # Right types related routes
  get "/right_types" => "right_types#all"

  # Devise auth for model 'User'
  devise_for :users, controllers: {sessions: 'sessions'}

  # Transactions related routes
  get "/transactions" => "transactions#index"
  post "/transactions/create_transaction" => "transactions#create"
  post "/transactions/update_transaction" => "transactions#update"
  delete "/transactions/:id" => "transactions#delete"

  # Hours in the bank
  get "/hours/entries" => "hours_in_the_bank#entries", as: :hours_entries
  get "/hours/summary" => "hours_in_the_bank#summary", as: :hours_summary
  get "/hours/active_projects" => "hours_in_the_bank#active_projects", as: :active_projects
  get "/hours/:work_chart_id" => "hours_in_the_bank#show", as: :show_hours

  # Client logging
  post "/client_log" => "client_log#log"

  # Settings
  get "/settings" => 'settings#index'
  
  end

  # Container/Coolify health check. Uses the Rails built-in controller, which
  # skips ApplicationController's per-request side effects (front.version read,
  # charts-version header, persistance log).
  get "up" => "rails/health#show", as: :rails_health_check

  # Catch-all route for React front-end
  root to: "home#index"
  get '*path', to: "home#index", constraints: ->(req) { req.format.html? }
  
end
