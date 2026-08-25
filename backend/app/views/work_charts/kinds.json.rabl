collection @kinds
node :display_label do |kind|
  kind.display_label
end
node :code do |kind|
  kind.code
end
node :is_default do |kind|
  @defaults.map(&:kind_code).include? kind.code
end
node :is_inherited do |kind|
  !@immediate.map(&:kind_code).include?(kind.code)
end
node :inherited_from_id do
  @inherited_from_id
end
