(1) Sign in & Log in via UofT Email
As a user, I want to sign up/log in with my UofT email so that I can access Campus Compass.
Given I enter a valid email on the sign-up page
When I submit the form
Then my account is created

(2) Registration for Clubs
 As a club executive, I want to register a club profile so our team can post events.
Given I fill in club details and upload a logo
When I click “Create Club”
Then the club profile appears in search and I become its first admin

(3) Club Executive Controls
 As a club executive, I want to add additional club executives so multiple people can manage our club page.
Given I am on the club settings screen
When I enter another user’s email and click “Add Executive”
Then that user gains executive rights

(4) Ability to Create Post Listing
 As a club executive, I want to create an event post so details show instantly in the feed.
Given all required fields are filled
When I click “Publish”
Then the post appears in the feed under the correct category

(5) Searching for Posts by Keyword
As an user, I want to search for posts by keyword so I can quickly find events of interest.
Given I type “#Game” in the search bar
When I press Enter
Then all posts whose captions or stored hashtags include “#Game” are listed, sorted by most recent


(6) Event Analytics
As a club executive, I want analytics on my posts so I can improve outreach.
Given I open the Analytics dashboard
When the data loads
Then I see likes, click-throughs, and other information for each post

(7) Export to Calendar
As a user, I want to export an event to my phone calendar so that I can get reminders.
Given I click “Add to Calendar” on an event page
When the .ics file downloads
Then My mobile calendar opens with the event details pre-filled

(8) Browse Clubs and Posts
As a user, I want to browse a feed of all clubs and posts so I can discover opportunities easily.
Given I am logged in
When I open the home page
Then I see a personalized feed of categorized posts

(9) Set Notifications
As a user, I want to set notification preferences so I control what emails I get.
Given: I toggle “Email me about new events”
When: I save changes
Then: only the selected notification types are sent

(10) Editing
 Posts
As a club executive, I want to edit a post so I can correct mistakes.
Given: I’m viewing my post and click “Edit”
When: I update the content and save
Then: the changes appear instantly in the feed

(11) Deleting Posts
As a club executive, I want to delete a post that is wrong/unwanted.
Given: I click “Delete”
When: I confirm
Then: the post is removed from view

(12) Deleting Account
As a user, I want to delete my account so I can remove my data from the platform.
Given: I open Account Settings
When: I click “Delete Account” and confirm
Then: my profile and data are permanently removed and I’m logged out


(13) Page to Show Posts by a User's Followed Clubs
As a user, I want a dedicated page that shows recent posts from the clubs I follow so that I can keep up with their updates in one place.
Given I have followed at least one club and navigate to the “Following” tab
When the page loads
Then I see a list of the latest posts (events, hiring, announcements) from only the clubs I follow


(14) Searching for Clubs by Keyword
As a user, I want to search for clubs by keyword so I can quickly find groups of interest.
Given I enter “Debate” in the search bar
When I press Enter
Then clubs with “Debate” in their names or descriptions are listed

(15) Allow User to Follow Clubs
As a user, I want to follow a club so its posts are prioritized in my feed.
Given I click “Follow” on a club page
When the action succeeds
Then future posts from that club move to the top of my feed

(16) Allow User to Like Posts
 As a user, I want to like a post so clubs know I’m interested.
Given I tap the heart icon on a post
When the like is recorded
Then the icon fills and the like count increases by one

(17) Allow User to Log Out
As a user, I want to log out so I can securely end my session.
Given I am logged in and on any page
When I click the “Log Out” button in the user menu
Then I am redirected to the login page, and I see a confirmation message that I have successfully logged out

(18) Page to Show Posts by a User's Followed Clubs
As a user, I want a dedicated page that shows recent posts from the clubs I follow so that I can keep up with their updates in one place.
Given: I have followed at least one club and navigate to the “Following” tab
When: the page loads
Then: I see a list of the latest posts (events, hiring, announcements) from only the clubs I follow

(19) Website Admin Controls
As a website admin, I want permission controls so I can grant executive status to specific members.
Given I am logged in as an admin and on the club settings page
When I enter a member’s email and click “Make Executive”
Then that member gains executive permission

(20) AI Chatbot
As a user, I want an AI chatbot so I can ask quick questions about events.
Given I ask the chatbot, “What time is the Coding Club orientation?”
When the bot processes my request
Then it replies with the event’s time from the database

(21) Allow Club Executive to Update Club Page
As a club executive, I want to update our club profile (name, description, logo, Instagram handle, external links) so students see accurate information.
Given: I am logged in as a club executive and on the “Edit Club Profile” page
When: I change the name, description, logo image, Instagram handle, or links and click “Save Changes”
Then: the updated details are stored in the database and displayed on the club’s public page

(22) External Post Links
As an user, I want to sign up for an event or register for a hiring position via an external link.
Given: I click on any link
When:  the link opens
Then: I am redirected to the specific form in a new tab

