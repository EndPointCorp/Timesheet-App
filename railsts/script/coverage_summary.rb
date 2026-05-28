#!/usr/bin/env ruby
# Generates a one-page, shareable PDF summary of the latest SimpleCov run.
#
#   make coverage      # produces coverage/.resultset.json
#   make coverage-pdf  # runs this -> coverage/coverage_summary.pdf
#
# Reads coverage/.resultset.json and computes overall %, a by-area breakdown
# and the biggest gaps. Renders with Prawn (pure Ruby, no system binary) so it
# works on any architecture.

require 'json'
require 'date'
require 'prawn'
require 'prawn/table'

ROOT      = File.expand_path('..', __dir__)
RESULTSET = File.join(ROOT, 'coverage', '.resultset.json')
PDF_OUT   = File.join(ROOT, 'coverage', 'coverage_summary.pdf')

abort "No coverage data at #{RESULTSET}. Run `make coverage` first." unless File.exist?(RESULTSET)

coverage = JSON.parse(File.read(RESULTSET)).values.first['coverage']

def line_hits(value)
  value.is_a?(Hash) ? value['lines'] : value
end

areas = Hash.new { |h, k| h[k] = [0, 0] } # name => [covered, total]
files = []

coverage.each do |path, value|
  lines   = line_hits(value).compact
  total   = lines.size
  next if total.zero?
  covered = lines.count { |n| n > 0 }
  rel     = path.sub(%r{\A/app/}, '')
  files << [rel, covered, total]

  parts = rel.split('/')
  group =
    if parts[0] == 'app' && parts.size > 2 then "app/#{parts[1]}"
    elsif parts[0] == 'app'                then 'app'
    else parts[0]
    end
  areas[group][0] += covered
  areas[group][1] += total
end

tot_cov   = files.sum { |_, c, _| c }
tot_total = files.sum { |_, _, t| t }
overall   = tot_total.zero? ? 0.0 : 100.0 * tot_cov / tot_total
pct       = ->(c, t) { t.zero? ? 0.0 : 100.0 * c / t }

area_rows = [['Area', 'Lines', 'Coverage']] +
  areas.sort_by { |_, (_, t)| -t }.map { |name, (c, t)|
    [name, "#{c} / #{t}", format('%.1f%%', pct.call(c, t))]
  }

gap_rows = [['File', 'Missed', 'Coverage']] +
  files.sort_by { |_, c, t| -(t - c) }.first(10).map { |rel, c, t|
    [rel, (t - c).to_s, format('%.1f%%', pct.call(c, t))]
  }

GREY  = '777777'
DARK  = '222222'
GREEN = '22aa66'

Prawn::Document.generate(PDF_OUT, page_size: 'A4', margin: 42) do
  fill_color DARK
  text 'Timesheet Backend - Test Coverage Summary', size: 18, style: :bold
  fill_color GREY
  text "Generated #{Date.today.iso8601} from SimpleCov (line coverage)", size: 9
  move_down 16

  fill_color DARK
  formatted_text [
    { text: 'Overall: ' },
    { text: format('%.1f%%', overall), styles: [:bold], size: 22, color: GREEN },
    { text: "   (#{tot_cov} / #{tot_total} lines covered)", color: GREY }
  ], size: 12
  move_down 18

  fill_color GREY
  text 'COVERAGE BY AREA', size: 10, style: :bold
  fill_color DARK
  move_down 4
  table(area_rows, width: bounds.width, cell_style: { size: 10, padding: [4, 8], borders: [:bottom], border_color: 'eeeeee' }) do |t|
    t.row(0).font_style = :bold
    t.row(0).text_color = '888888'
    t.columns(1..2).align = :right
  end
  move_down 22

  fill_color GREY
  text 'BIGGEST GAPS (BY UNCOVERED LINES)', size: 10, style: :bold
  fill_color DARK
  move_down 4
  table(gap_rows, width: bounds.width, cell_style: { size: 9, padding: [4, 8], borders: [:bottom], border_color: 'eeeeee' }) do |t|
    t.row(0).font_style = :bold
    t.row(0).text_color = '888888'
    t.columns(1..2).align = :right
  end
  move_down 24

  fill_color GREY
  text 'Line coverage only. Files are loaded at boot, so class/method definition lines ' \
       'count as covered even when method bodies are never exercised - treat the headline ' \
       'as a slight over-estimate of behavioral coverage.', size: 8
end

puts "Wrote #{PDF_OUT} (overall #{format('%.1f%%', overall)})"
