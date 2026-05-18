collection @items
if @full_descriptions
  attributes :name, :total, :children, :description
else
  attributes :name, :total, :children
end
