class Role < ActiveRecord::Base
  self.table_name = :roles

  has_many :role_has_roles, class_name: RoleHasRole
  has_many :roles, through: :role_has_roles
  has_many :check_role_id,
    class_name: "RoleHasRole",
    foreign_key: :role_id
  has_many :has_roles,
    class_name: "RoleHasRole",
    foreign_key: :has_role_id
  has_many :roles_has_roles,
    class_name: "RoleHasRole",
    foreign_key: :has_role_id
  has_many :has_roles,
    class_name: "RoleHasRole",
    foreign_key: :has_role_id
  has_many :rights,
    class_name: "Right",
    foreign_key: :role_id
  has_one :user, class_name: 'User', foreign_key: :role_id

  validates :display_label, presence: true, length: { in: 4..40 }
  validates :code, presence: true, uniqueness: true
  validates :description, presence: true

  def self.active_users
    joins(:user).
      where(user: { status_code: 'enabled'}).
      where.not(user: { username: 'root'}).
      order("display_label ASC")
  end
 
  # Equivalent of IC::M::Role.check_right Perl method
  # from old version of system
  def has_right_to(right_type_code, target = nil)
    return true if (self.rights.includes(:right_type).any? { |r| r.right_type.code == RightType::SUPERUSER }) && 
                   (right_type_code != RightType::NEWFEATURESTESTER)
    # return false if right_type_code == RightType::SUPERUSER
    roles = [self]
    while roles.count > 0
      
      return true if roles.any? do |role|
        role.rights.includes(:right_type).any? do |right|
          if right.right_type.code != right_type_code
            false
          else
            if target
              targets = right.targets
              targets.any? do |t| 
                result = t.referenced.class.to_s == target.class.to_s && 
                  t.referenced.id == target.id rescue false
                if result
                  true
                else
                  ref = t.referenced
                  if target.class.to_s == 'Role' && ref.class.to_s == 'Role'
                    has_roles = Role.joins(:roles).where("roles_has_roles.has_role_id = #{t.referenced.id}")
                    has_roles.any? { |r| target.id == r.id }
                  else
                    false
                  end
                end
              end
            else
              true
            end
          end
        end
      end 

      # no luck yet - lets go deeper
      roles = roles.map(&:roles).flatten
    end
    false
  end

  def user_name
    self.display_label.gsub(/User:\s/,'').camelize
  end

  def team_manager
    self.user.team.try(:manager)
  end

  def get_assigned_roles
    roles_sql = <<-sql
      with recursive rec_roles(id, aggregated) as (
          select roles_has_roles.has_role_id, array[roles_has_roles.role_id]
          from roles_has_roles
          where roles_has_roles.role_id = #{self.id} 
          group by roles_has_roles.has_role_id, roles_has_roles.role_id
        union all
          select roles_has_roles.has_role_id, rec_roles.aggregated || rec_roles.id
          from roles_has_roles, rec_roles
          where roles_has_roles.role_id = rec_roles.id
            and roles_has_roles.role_id != all(rec_roles.aggregated)
            and rec_roles.id is not null
          group by roles_has_roles.has_role_id , rec_roles.aggregated, roles_has_roles.has_role_id, rec_roles.id
      )
      select array_agg(distinct id) as role_ids from rec_roles
    sql
    assigned_roles = Role.connection.execute(roles_sql).to_a.first['role_ids'].to_s.gsub(/\{|\}/, '').split(',').map { |x| x.to_i } || []
    assigned_roles << self.id
    assigned_roles.sort
  end  

end
