@javascript
Feature: Transactions list in the work charts editor

  Scenario: Viewing the transaction with "zero-out" mode
    Given I'm logged in as a manager
      And There's a client named "Acme Corporation"
      And There's a recurring zero-out transaction for "Acme Corporation"
     When I access the charts editor
      And I select "Acme Corporation" in the charts selector
      And I choose the "Transactions" tab
     Then I should see 1 transaction on the list
      And I should see a string "Zeroing out" in the 1st transaction on the list

  Scenario: Viewing the transaction with the "cumulative" mode
    Given I'm logged in as a manager
      And There's a client named "Acme Corporation"
      And There's a recurring cumulative transaction for "Acme Corporation"
     When I access the charts editor
      And I select "Acme Corporation" in the charts selector
      And I choose the "Transactions" tab
     Then I should see 1 transaction on the list
      And I should see a string "Cumulative" in the 1st transaction on the list

  Scenario: Viewing the transaction that doesn't recur to see the recur mode
    Given I'm logged in as a manager
      And There's a client named "Acme Corporation"
      And There's a transaction for "Acme Corporation"
     When I access the charts editor
      And I select "Acme Corporation" in the charts selector
      And I choose the "Transactions" tab
     Then I should see 1 transaction on the list
      And I should not see a string "Cumulative" in the 1st transaction on the list
      And I should not see a string "Zeroing out" in the 1st transaction on the list
