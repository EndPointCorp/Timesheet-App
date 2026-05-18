collection @transactions
attributes :id, :date, :date_closed, :hours, :description, :mode, :kind, :recur_at
node :author do |t|
  t.author.try(:attributes).try(:fetch, 'email')
end
node :author_name do |t|
  t.author.try(:attributes).try(:fetch, 'name')
end
node :mode do |t|
  t.kind_code
end
node :recur_mode do |t|
  t.mode
end
node :is_active do |t|
  t.date < DateTime.now() && (t.date_closed.nil? || t.date_closed > DateTime.now())
end
