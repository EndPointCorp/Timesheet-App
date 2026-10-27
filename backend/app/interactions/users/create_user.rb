class Users::CreateUser < ActiveInteraction::Base

  EMAIL_REGEX=/\A([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})\z/i

  boolean :is_ensure_email_unique, default: false
  boolean :is_ensure_username_unique, default: false

  string :email, :username, :name, :time_zone_code, :password, :start_date
  integer :effective_role_id

  array :teams, default: []

  validate :ensure_email_unique, :ensure_username_usable, :ensure_username_unique, :verify_time_zone, :validate_start_date
  
  validates :email, presence: true
  validates :username, presence: true
  validates :name, presence: true
  validates :time_zone_code, presence: true
  validates :password, presence: true
  validates :start_date, presence: true
  validates :password, length: { in: 6..20 }
  validates :email, format: EMAIL_REGEX
  validates :hash, presence: true

  def execute
    User.transaction do
      u = User.new
      u.created_at = DateTime.now
      u.status_code = "enabled"
      u.name = name
      u.username = username.downcase
      u.password = password
      u.password_confirmation = password
      u.email = email
      u.time_zone_code = time_zone_code
      u.start_date = DateTime.parse(start_date.to_s)
      u.created_by = u.modified_by = effective_role_id

      r = Role.new
      r.date_created = r.last_modified = DateTime.now
      r.created_by = r.modified_by = effective_role_id
      r.code = "user_#{username.downcase}"
      r.display_label = "User: #{username}"
      Role.where('code IN (?)', ["non_management", "user", "biller", "technical_staff"] + teams).to_a.each do |role|
        r.role_has_roles << RoleHasRole.new(has_role_id: role.id, date_created: DateTime.now, created_by: effective_role_id, last_modified: DateTime.now, modified_by: effective_role_id)
      end
      r.description = "User role for #{u.username}"
      r.save!
      u.role = r
      u.save!

      naggable = Right.new date_created: DateTime.now, last_modified: DateTime.now, modified_by: effective_role_id, created_by: effective_role_id, role_id: u.role_id, is_granted: true
      naggable.right_type = RightType.where({code: "naggable"}).first
      naggable.save!
      u
    end
  end

  private

  def verify_time_zone
    # Validate against the master time_zones table (mirrors the users
    # time_zone_code foreign key), not the zones existing users happen to have.
    unless TimeZone.exists?(code: time_zone_code)
      errors.add(:time_zone_code, 'doesn\'t exist')
    end
  end
  
  def ensure_email_unique
    if User.find_by_email email and User.find_by_email email and !is_ensure_email_unique
      errors.add(:email, 'already exists')
    end
    @is_ensure_email_unique = true
  end

  # The controller takes the username from the part of the email before the @.
  # The database rejects anything but 2 to 30 letters, and without this check
  # that surfaces as a 500 with no message.
  def ensure_username_usable
    return if username.blank?

    unless username.downcase.match?(User::USERNAME_FORMAT)
      errors.add(:username, "\"#{username}\" can't be used. It is taken from the part of the " \
        "email before the @, and must be 2 to 30 letters (a-z) only")
    end
  end

  # Usernames are stored in lower case, so compare in lower case. Otherwise
  # "Bob@..." slips past this check when "bob" exists and fails in the database.
  def ensure_username_unique
    if User.find_by_username username.downcase and !is_ensure_username_unique
      errors.add(:username, 'already exists')
    end
    @is_ensure_username_unique = true
  end

  def validate_start_date
    begin
      DateTime.parse(start_date.to_s)
    rescue ArgumentError  
      errors.add(:start_date, 'invalid format')
    end
  end

end
