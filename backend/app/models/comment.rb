#  id          | integer                     
#  review_id   | integer                     
#  author_id   | integer                     
#  stage_value | integer                     
#  body        | text                        
#  created_at  | timestamp without time zone 
#  updated_at  | timestamp without time zone 
# Indexes:
#     "comments_pkey" PRIMARY KEY, btree (id)
class Comment < ActiveRecord::Base
end
