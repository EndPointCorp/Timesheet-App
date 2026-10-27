class User < ActiveRecord::Base
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable

  # What the users table accepts as a username: users_username_check plus the
  # varchar(30) column. A spec compares this against the real constraint.
  USERNAME_FORMAT = /\A[a-z]{2,30}\z/

  scope :naggable, -> { joins(role: {rights: :right_type}).where('right_types.code' => RightType::NAGGABLE) }

  has_many :transactions

  belongs_to :user_status,
    foreign_key: :status_code,
    primary_key: :code,
    class_name: "UserStatus"
  belongs_to :role,
    class_name: "Role",
    foreign_key: :role_id

  before_save :downcase_username

  def downcase_username
    self.username.downcase!
  end

  def active?
    if self.status_code == "disabled"
      false
    else
      true
    end
  end

  # override Devise default method to disable user from logging in
  def active_for_authentication?
    super && active?
  end

  # TODO: switch to pundit
  def can_edit_charts
    @_can_edit_charts ||=
      (self.role.has_right_to RightType::MANAGE) || (self.role.has_right_to RightType::SUPERUSER)
  end

  def is_admin?
    @_is_admin ||=
      self.role.has_right_to RightType::SUPERUSER
  end

  def can_create_users?
    @_can_create_users ||=
      (self.role.has_right_to RightType::SUPERUSER) || (self.role.has_right_to RightType::CREATE_USERS)
  end

  def can_switch_roles
    @_can_switch_roles ||= self.others_accessible.count > 0
  end

  def is_manager?
    @_is_manager ||= self.role.has_right_to RightType::MANAGER
  end

  def is_new_features_tester?
    @_is_new_features_tester ||= self.role.has_right_to RightType::NEWFEATURESTESTER
  end

  def self.global_reviewers
    where role_id: Right.where(right_type_id: RightType.where(code: "global_reviewer").select(:id)).select(:role_id)
  end

  def receives_project_emails?
    role_ids = self.role.get_assigned_roles
    project_email_rights = Right.where("role_id in (:ids)", ids: role_ids).
      joins(:right_type).
      where("right_type.code = :code", code: 'get_nag_emails_for_project_manager')
    project_manager_rights = Right.where("role_id in (:id)", id: role_ids).
      joins(:right_type).
      where("right_type.code = :code", code: 'project_manage')
    (project_email_rights.length > 0)  || (project_manager_rights.length > 0)
  end

  def is_director?
    self.role.roles.where(code: ['director', 'officer']).count > 0
  end

  def reportable_work_charts
    unless @reportable_work_charts
      rights = []
      role_ids = self.role.get_assigned_roles
      rights = Right.where("role_id in (:ids)", ids: role_ids).
        joins(:right_type).
        where("right_types.code = :code", code: 'report').
        where("right_types.target_kind_code = :code", code: 'work_chart')
      @reportable_work_charts = RightTarget.where(right_id: rights).map{|rt| Integer(rt.ref_obj_pk)}
    end
    @reportable_work_charts
  end

  def reportable_users
    unless @reportable_users
      role = self.role
      @reportable_users = if role.has_right_to RightType::SUPERUSER
        User.includes(:role).where("email <> ?", "root@domain.com")
      else
        User.includes(:role).all.select do |u|
          role.has_right_to(RightType::REPORT, u.role)
        end + [User.where(email: self.email).first]
      end.uniq
    end
    @reportable_users
  end

  def others_accessible
    unless @others_accessible
      role = self.role
      @others_accessible = if role.has_right_to RightType::SUPERUSER
        User
          .where("role_id <> ? AND email <> ?", self["role_id"], "root@domain.com")
      else
        User.includes(:role).all.select do |u|
          role.has_right_to(RightType::SWITCH_USER, u)
        end
      end
    end
    @others_accessible # .select { |u| u.role.has_right_to RightType::BILL }
  end

  def self.invoicers
    joins(role: :role_has_role).
    joins("inner join roles roles on roles.id = role_has_roles.has_role_id").
      where(roles: { code: 'invoicer' })
  end

  def team
    @team ||= Team.by_user(self).first
  end

  def team_managers
    managers = Role.joins(rights: [:right_type, :targets]).
       where(right_types: { code: "manage_team" },
             right_targets: { ref_obj_pk: Team.by_user(self).select(:role_id).map(&:role_id)})

    User.where(role_id: managers.map(&:id)).to_a.compact
  end

  def is_manager_for?(user)
    return false if user.role.team_manager.nil?
    user.role.team_manager.id == self.id
  end

  def team_manager
    self.role.team_manager
  end

  # convenience method for working with the rails console
  def self.by_name(name)
    User.where(email: "#{name}@endpointdev.com").first
  end

  def clients_represented
    @_clients_represented || lambda {
      targets = RightTarget.joins(right: [ :role, :right_type ]).
        where(right_types: { code:  'represent' } ).
        where(right: { role_id: self.role_id } )
      @_clients_represented = WorkChart.where("id in (:ids)", ids: targets.select('ref_obj_pk :: integer'))
    }.call
  end

  def is_rep_for?(work_chart)
    return false unless work_chart.client_rep
    work_chart.client_rep.id == self.id
  end

  def make_superuser!
    return if self.is_admin?

    right = Right.new date_created: DateTime.now, last_modified: DateTime.now, role_id: self.role_id, is_granted: true
    right.right_type = RightType.where(code: 'superuser').first
    right.save!
  end

  def is_owner_of?(entry)
    entry.role_id == self.role_id
  end

  def hire_date
    if self.start_date.nil?
     DateTime.now
    else
     self.start_date
    end
  end

  def vacation_total_by_year(start_date, end_date)
    WorkEntry.by_user(self).vacation_entries.between_dates(start_date, end_date).total_hours
  end

  def holiday_total_by_year(start_date, end_date)
    WorkEntry.by_user(self).holiday_entries.between_dates(start_date, end_date).total_hours
  end

  def sick_total_by_year(start_date, end_date)
    WorkEntry.by_user(self).sick_entries.between_dates(start_date, end_date).total_hours
  end

  def get_team_nag_email_recipients
    team = Role.where(id: self.team.try(:role_id)).first if self.team
    return [] unless team
    team_nag_email_right = RightType.where(code: "get_nag_emails_for_team").map(&:id)
    rights_targeting_team = RightTarget.where(ref_obj_pk: team.id.to_s).map(&:right)
    nag_email_right_targeting_team = rights_targeting_team.reject{|right| !team_nag_email_right.include?(right.right_type_id)}
    nag_email_right_targeting_team.map(&:role).map(&:user).map(&:email)
  end
end
