module HoursInTheBankHelper
  def buy_hours chart, hours, date = 0.days.ago
    Transactions::CreateTransaction.run! hours: hours,
      work_chart_id: chart.id,
      date: date.to_date,
      mode: 'cumulative',
      kind: 'regular',
      user_id: (User.first || FactoryBot.create(:user) ).id,
      description: ''
  end
end
