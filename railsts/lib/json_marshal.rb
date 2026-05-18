class JsonMarshal
  def self.dump(data)
    if data.is_a? Array
      data.map { |d| self.dump d }
    elsif data.is_a? Hash
      data.inject({}) do |m, kv|
        k, v = kv
        m[k] = self.dump(v)
        m
      end
    else
      json = data.as_json
      if json == data
        json
      else
        {
          _type: data.class.name,
          _value: data.class == Class ? data.name : json
        }
      end
    end
  end

  def self.load(json_value)
    if json_value.is_a? Array
      json_value.map { |v| self.load v }
    elsif json_value.is_a? Hash
      if json_value.keys.map(&:to_s).sort == [ "_type", "_value" ]
        klass = (json_value["_type"] || json_value[:_type]).constantize
        value = json_value["_value"] || json_value[:_value]
        if value.is_a? Hash
          value.inject(klass.new) do |m, kv|
            k, v = kv
            m.send("#{k}=", v)
            m
          end
        elsif klass == Symbol
          value.to_sym
        elsif klass == Class
          value.constantize
        end
      else
        json_value.inject({}) do |m, kv|
          k, v = kv
          m[k] = self.load(v)
          m
        end
      end
    else
      json_value
    end
  end
end
