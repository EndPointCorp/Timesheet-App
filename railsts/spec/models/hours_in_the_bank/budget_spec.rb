require 'spec_helper'

describe HoursInTheBank::Budget do
  it "works with overlapping transactions" do
    FactoryBot.create(:client_work_chart). tap do |chart|
      2.times do |i|
        FactoryBot.create \
          :transaction,
          date: (i + 1).weeks.ago,
          hours: 1,
          work_chart_id: chart.id,
          kind_code: "billable"
      end

      FactoryBot.create :work_entry,
        work_chart_id: chart.id,
        duration_total: 15,
        type: "billable",
        date_performed: (1.week + 1.day).ago
    end

    budget = HoursInTheBank::Budget.first

    expect(budget.hours_left).to eq("01:45:00")
  end

  it "works when overlaps happen across the levels of charts" do
    client1 = FactoryBot.create(:client_work_chart)
    general = FactoryBot.create(:client_work_chart, parent_id: client1.id)
    subproject1 = FactoryBot.create(:client_work_chart, parent_id: client1.id)
    subproject1general = FactoryBot.create(:client_work_chart, parent_id: subproject1.id)

    FactoryBot.create \
      :transaction,
      date: 3.weeks.ago,
      hours: 10,
      work_chart_id: client1.id,
      kind_code: "billable"

    FactoryBot.create \
      :transaction,
      date: 2.weeks.ago,
      date_closed: 2.days.ago,
      hours: 10,
      work_chart_id: subproject1.id,
      kind_code: "billable"

    FactoryBot.create \
      :transaction,
      date: 1.weeks.ago,
      hours: 10,
      work_chart_id: subproject1.id,
      kind_code: "billable"

    FactoryBot.create :work_entry,
      work_chart_id: general.id,
      duration_total: 15,
      type: "billable",
      date_performed: (1.week - 1.day).ago

    FactoryBot.create :work_entry,
      work_chart_id: subproject1general.id,
      duration_total: 30,
      type: "billable",
      date_performed: (1.week - 1.day).ago

    budget_client1 = HoursInTheBank::Budget.where(work_chart_id: client1.id).first
    budget_project = HoursInTheBank::Budget.where(work_chart_id: subproject1.id).first

    expect(budget_client1.hours_left).to eq("09:45:00")
    expect(budget_project.hours_left).to eq("09:30:00")
  end

  it "works properly with dates" do
    client1 = FactoryBot.create(:client_work_chart)

    FactoryBot.create \
      :transaction,
      date: 3.weeks.ago,
      date_closed: 2.weeks.ago,
      hours: 10,
      work_chart_id: client1.id,
      kind_code: "billable"

    FactoryBot.create :work_entry,
      work_chart_id: client1.id,
      duration_total: 4*60,
      type: "billable",
      date_performed: (2.weeks + 1.day).ago

    FactoryBot.create \
      :transaction,
      date: 2.weeks.ago,
      date_closed: 1.weeks.ago,
      hours: 10,
      work_chart_id: client1.id,
      kind_code: "billable"

    FactoryBot.create :work_entry,
      work_chart_id: client1.id,
      duration_total: 4*60,
      type: "billable",
      date_performed: (2.weeks + 1.day).ago

    FactoryBot.create \
      :transaction,
      date: 1.week.ago,
      date_closed: 0.weeks.ago,
      hours: 10,
      work_chart_id: client1.id,
      kind_code: "billable"

    FactoryBot.create \
      :transaction,
      date: 0.week.ago,
      date_closed: 1.weeks.since,
      hours: 10,
      work_chart_id: client1.id,
      kind_code: "billable"

    budget = HoursInTheBank::Budget.where(work_chart_id: client1.id).first

    expect(budget.hours_left).to eq("10:00:00")
  end
end
