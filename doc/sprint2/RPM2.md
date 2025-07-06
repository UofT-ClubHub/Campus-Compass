# Release Planning Meeting Document

## Release Plan

### Release Name: Sprint 2 Release

--- 

## Release Objectives



### Specific Goals
- Implement Instagram Scraper for Clubs/Posts
  - **Specific:** Develop and implement an Instagram scraper using Apify to scrape data
  - **Measurable:** Successfully scrape and store 20 posts across 5 different clubs
  - **Achievable:** Apify provides prebuilt scraping tools
  - **Relevant:** This is the data that we are providing to our users
  - **Time-bound:** Complete within Sprint 2
- Optimize Search Page / Infinite Scroll
  - **Specific:**  Enhance the search page by implementing infinite scrolling and automated filtering
  - **Measurable:** Infinite scrolling works and posts get filtered as the user types into the search bar
  - **Achievable:** We have prior experience with pagination and post filtering
  - **Relevant:** Improves user experience and better content discoverability
  - **Time-bound:** Complete within Sprint 2
- Edit/Delete/View Posts in Detail
  - **Specific:**  Implement ability to edit/delete/view posts
  - **Measurable:** Ensure data is properly maintained in the database and posts are viewable
  - **Achievable:** Backend endpoints are already implemented and we just need to integrate frontend
  - **Relevant:** Ensures data is up to date
  - **Time-bound:** Complete within Sprint 2

### Participants: 
- **Oscar**: Editing/Deleting Posts
- **Imran**: Instagram Scraper
- **Eishan**: Browsing Posts/Clubs
- **Dibya**: API Authorization
- **Hong Yu**: User Profile

### Metrics for Measurement
- Users will only be able to access certain features of the website
- Scraper scrapes all the relevant club/post information
- Correct retrieval of data

## Release Scope

### Included Features
- Instagram Scraper
  - Scrapes instagram for Club/Post information
  - Successfully stores data in database
- Optimized Searching
  - Implemented infinite scrolling for search results
  - Automatically filtering searches without the need of clicking enter
- Edit/Delete/View Posts in Detail
  - Edit/Delete Posts
  - Ability to view posts in more detail after clicking on it

### Excluded Features
- AI-Powered Chatbot for Instant Answers
  - Will be included in a later release
- User Interaction & Club Engagement Analytics
  - Will be included in a later release
- Personalized Social Layer for Smart Recommendations
  - Will be included in a later release

### Bug Fixes
- None right now

### Non-Functional Requirements
- Performance
  - API response < 500ms
  - Pages should load < 1 second
- Security
  - Secure Authentication through Firebase
- Usability
  - User Friendly UI
  - Intuitive Navigation

### Dependencies and Limitations
- **Dependencies:** Firebase, Next.js, Tailwind CSS, Apify(Instagram Scraper), Hugginface(Text Classification)
- **Limitations:** 
  - Limited functionality of the website due to the early stage of development

## Additional Thoughts on Considerations for Full Organizational Deployment

### Detailed Instruction - Steps to Carry Out the Deployment
- Ensure all dependencies are properly installed
- Back up the database before deployment
- Perform a smoke test to verify proper functionality

### PIV (Post Implementation Verification) Instruction
- Perform tests to ensure proper functionality of features
- Check database integrity
- Confirm proper integration between front and back end
- Test key user flows such as user registration/login and club/post filtering


### Post Deployment Monitoring
- Track API response times and application loading times
- Monitor system logs for errors, crashes and unexpected behaviour

### Roll Back Strategy
- Keep a backup of previous versions and branches
- Restore the latest database backup if data becomes corrupted
