class CrispCss
  def self.process!(html)
    Rails.logger.debug "Processing html:\n\n#{html}"
    doc = Nokogiri::XML(html) { |config| config.noblanks }
    doc.css('link').each do |link|
      process_link_tag!(link, doc)
    end
    doc.to_s
  end

  def self.process_link_tag!(link, doc)
    parser = CssParser::Parser.new
    url = link['href']
    if url.start_with? InstanceInfo.base_url
      path = File.join Rails.root, "public", url.split(InstanceInfo.base_url).last
      parser.load_file! path
    else
      parser.load_uri!(link['href'])
    end
    style_node_content = if link['data-no-filter'].present?
      parser.to_s.gsub(/url\(\//, "url(#{InstanceInfo.base_url}/")
    else
      selectors = []
      parser.each_selector do |sel, dec, _b|
        begin
          selectors << {sel: sel, dec: dec} if !doc.css(sel).empty?
        rescue
        end
      end
      selectors.
        map { |spec| "#{spec[:sel]} { #{spec[:dec]} }" }.
        join("\n")
    end
    link.content = style_node_content
    link.name = 'style'
    link['type'] = 'text/css'
    link.remove_attribute('href')
    link.remove_attribute('rel')
    link
  rescue => e
    Rails.logger.error "Unable to process link tag for crispy CSS - #{e.message}"
    link
  end
end
