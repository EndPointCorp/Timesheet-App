class Right < ActiveRecord::Base
  self.table_name = :rights

  belongs_to :right_type,
    class_name: "RightType",
    foreign_key: :right_type_id

  has_many :targets,
    class_name: "RightTarget",
    foreign_key: :right_id

  belongs_to :role,
    class_name: "Role",
    foreign_key: :role_id
end
