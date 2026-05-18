@javascript
Feature: The main calendar

  Scenario: Empty month with empty calendar
    Given that I have a normal user
      And that I'm logged in
      And I don't have any entries in the current month
    When I access the main calendar page
    Then I should see all day totals showing "0.00"
