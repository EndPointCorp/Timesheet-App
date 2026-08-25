namespace :create do
  task missing_relationship_nodes: :environment do
    CreateMissingRelationshipNodes.run!
  end
end
