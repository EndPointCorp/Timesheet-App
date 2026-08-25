class RightTarget < ActiveRecord::Base
  self.table_name = :right_targets
  self.primary_key = :id


  belongs_to :right,
    class_name: "Right",
    foreign_key: :right_id,
    primary_key: :id

  belongs_to :workchart,
    class_name: "WorkChart",
    foreign_key: :ref_obj_pk,
    primary_key: :id

  belongs_to :user,
    class_name: "User",
    foreign_key: :ref_obj_pk,
    primary_key: :id

  belongs_to :role,
    class_name: "Role",
    foreign_key: :ref_obj_pk,
    primary_key: :id

  def referenced
    unless @referenced
      @referenced = case self.right.right_type.target_kind_code
      when "role"
        Role.find self.ref_obj_pk.to_i
      when "user"
        User.find self.ref_obj_pk.to_i
      when "work_chart"
        WorkChart.find self.ref_obj_pk.to_i
      when "site_mgmt_action"
        Role.find self.ref_obj_pk.to_i
      when "account"
        WorkChart.find self.ref_obj_pk.to_i  
      else
        throw "Unimplemented right target referencing for code #{self.right.right_type.target_kind_code}"
      end
    end
    @referenced
  end

end
