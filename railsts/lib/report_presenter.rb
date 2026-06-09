class ReportPresenter

  def self.pdf_for(doc_params, document, report_type, effective_user, layout = :simple)
    render_for(:pdf, doc_params, document, report_type, effective_user, layout)
  end

  def self.html_for(doc_params, document, report_type, effective_user, layout = :simple)
    render_for(:html, doc_params, document, report_type, effective_user, layout)
  end

  def self.text_for(doc_params, document, report_type, effective_user, layout = :simple)
    render_for(:text, doc_params, document, report_type, effective_user, layout)
  end

  def self.render_for(mode, doc_params, document, report_type, effective_user, layout)
    if mode == :pdf
      html = html_for(doc_params, document, report_type, effective_user, layout)
      WickedPdf.new.pdf_from_string html
    else
      header = ApplicationController.renderer.render(
        template: "reports/#{layout}_header.#{mode}.erb",
        layout: layout.to_s,
        format: mode,
        locals: {
          params: doc_params,
          type: report_type.name.gsub(/Report::/, ''),
          effective_user: effective_user
        }
      )
      report  = ApplicationController.renderer.render(
        template: "reports/#{document.view}.#{mode}.erb",
        layout: false,
        format: mode,
        locals: {
          report: document,
          effective_user: effective_user
        }
      )
      if mode == :html
        CrispCss.process! header.gsub("</body>","<div class='report_content'>#{report}</div></body>") 
      else
        "#{header}#{report}\n\n(end)"
      end
    end
  end
end
