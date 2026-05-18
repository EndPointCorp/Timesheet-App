ActiveRecord::ConnectionAdapters::PostgreSQLAdapter.class_eval do
  def initialize_type_map_with_postgres_oids mapping
    initialize_type_map_without_postgres_oids mapping

    execute_and_clear("select atttypid from pg_attribute where attname = 'recur_at' limit 1", "SCHEMA", []) do |records|
      oid = records.to_a.first.try(:fetch, "atttypid")
      if oid.present?
        mapping.register_type oid,
          ActiveRecord::ConnectionAdapters::PostgreSQLAdapter::OID::SpecializedString.new(:recur_at)
      end
    end

    mapping.register_type 'recur_at',
      ActiveRecord::ConnectionAdapters::PostgreSQLAdapter::OID::SpecializedString.new(:recur_at)
  end

  alias_method_chain :initialize_type_map, :postgres_oids
end
