Feature: Hello World

    As an extension developer
    I want to test if a Webview is displayed

    Scenario: Webview Shows "Hello World!"
        When I open the Webview
        Then I expect that "Hello World!" is displayed
