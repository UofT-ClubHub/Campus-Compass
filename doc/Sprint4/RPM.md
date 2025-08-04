# Release Planning Meeting Document

## Release Plan

### Release Name: Sprint 4

--- 

## Release Objectives



### Specific Goals
- AI Chatbot
  - **Specific:** Develop an AI Chatbot that can answer questions from the user
  - **Measurable:** The chatn=bot should output the correct informartion majority of the time
  - **Achievable:** Firebase has some native support for chatbots which will help during development
  - **Relevant:** Allows the user to have support 24/7
  - **Time-bound:** Complete within Sprint 4
- Automate Scraper 
  - **Specific:**  Automate scraper to scraper information so data is automatically populated
  - **Measurable:** Scraper scrapes at least 1 post per club every day
  - **Achievable:** Using github actions we can run our script
  - **Relevant:** Ensures that the club events are up to date and relavent
  - **Time-bound:** Complete within Sprint 4

### Participants: 
- **Oscar**: Request Clubs & Github Actions
- **Imran**: Instagram Scraper Updates
- **Eishan**: UI Fixes & Github Actions
- **Dibya**: Chatbot
- **Hong Yu**: UI Updates & Github Actions

### Metrics for Measurement
- Chatbot can access the data and output accurate information to Users
- Scraper automatically runs every day at midnight

## Release Scope

### Included Features
- UI/UX Overhaul
  - Different Themes
  - Each club has their own page
  - General UI improvements
  - Filter persist across refreshes
- Carousel for Events/Clubs
  - Implemented infinite horizontal scrolling clubs/events
  - Automatically scroll for events/clubs
- Create/Delete/View Clubs
  - Edit/Delete/Edit Clubs
  - Allow users to request clubs
- Export to Calendar
  - Users are able to export events as an .ics file
- AI Chatbot
  - Users mays ask the chatbot for anything relating to clubs/events
- Request Clubs
  - Users may request clubs that they would want to see on the website
  - Users can see their request history to see the status of the requests

### Excluded Features
- All features are implemented

### Bug Fixes
- None Encountered

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
- **Limitations:** None

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
