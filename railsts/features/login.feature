@javascript
Feature: Login page

  Scenario: Viewing the login page form
    When I access the login page
    Then I should see the login form
     And I should see the "Email" field
     And I should see the "Password" field
     And the "Password" field should be of the "password" type
     And I should see the "Sign in" button

  Scenario: Logging in successfully
    Given there is a "user@endpointdev.com" user with a "ABCDefgh1234" password
     When I access the login page
      And I fill in "user@endpointdev.com" in the "Email" field
      And I fill in "ABCDefgh1234" in the "Password" field
      And I click on the "Sign in" button
     Then I should see "Logging in now, please wait." message
      And I should get redirected to the main calendar page

  Scenario Outline: Loggin in unsuccessfully
    Given there is a "user@endpointdev.com" user with a "ABCDefgh1234" password
     When I access the login page
      And I fill in "<email>" in the "Email" field
      And I fill in "<password>" in the "Password" field
      And I click on the "Sign in" button
     Then I should see "Authentication failed. Invalid username or password." message
      And I should not get redirected to the main calendar page

    Examples:
      | email | password |
      | | |
      | user@endpointdev.com | |
      | | ABCDefgh1234 |
      | user@endpointdev.com | abcdefgh1234 |
