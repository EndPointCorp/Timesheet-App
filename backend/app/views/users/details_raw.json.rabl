object false

child(@users_list, :object_root => false) do
  attributes :id, :name, :email, :role_id, :status_code, :time_zone
end
child(@users_list, :object_root => false) do
  attributes :id, :username
end
child(@groups_list, :object_root => false) do
  attribute :id, :code, :label
end
child(@rights_list, :object_root => false) do
  attribute :id, :role_id, :right_type_id
end
child(@targets_list, :object_root => false) do
  attribute :id, :right_id, :ref_obj_pk
end
child(@right_types_list, :object_root => false) do
  attribute :id, :code, :label, :target_kind_code
end
child(@role_has_roles_list, :object_root => false) do
  attribute :role_id, :has_role_id
end
child(@work_charts_list, :object_root => false) do
  attribute :id, :display_label
end
child(@users_list, :object_root => false) do
  attribute :id, :username
end
