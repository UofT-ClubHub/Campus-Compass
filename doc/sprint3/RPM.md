# Release Planning Meeting Document

## Release Plan

### Release Name: Sprint 3 Release

--- 

## Release Objectives



### Specific Goals
- UI Overhaul
  - **Specific:** Redesign the user interface to improve user experience
  - **Measurable:** Complete redesign of all pages
  - **Achievable:** Utilize frontend frameworks such as Tailwind to improve UI
  - **Relevant:** Enhancing UI improves user engagement and retention
  - **Time-bound:** Complete within Sprint 3
- Carousel for Events/Posts
  - **Specific:**  Implement a Carousel for events/clubs that loops infinitely
  - **Measurable:** Ensure all events/clubs are loaded and loop properly
  - **Achievable:** Leverage API endpoints to get data and only need to change frontend
  - **Relevant:** Improves user experience by adding smooth content browsing
  - **Time-bound:** Complete within Sprint 3
- Club Management
  - **Specific:**  Allows website admin to create/delete/edit clubs
  - **Measurable:** Sucessfully create/delete/edit clubs
  - **Achievable:** Build on existing API to manage clubs
  - **Relevant:** Ensures that data is up to date with current clubs
  - **Time-bound:** Complete within Sprint 3

### Participants: 
- **Oscar**: Club Management/UI Design 
- **Imran**: UI Overhaul & Dynamic Routing for Clubs
- **Eishan**: Testing & Sorting for Events/Posts
- **Dibya**: Chatbot/URL State Persistance
- **Hong Yu**: Export to Calander & Home Page Autoscrolling

### Metrics for Measurement
- Confirm that unauthorized users do not have access to protected pages/features
- Scraper scrapes all the relevant club/post information with 90% accuracy
- Correct retrieval/storage of data of posts/clubs/users 

## Release Scope

### Included Features
- UI Overhaul
  - Different Themes
  - Each club has their own page
  - General UI improvements
- Carousel for Events/Clubs
  - Implemented infinite horizontal scrolling clubs/events
  - Automatically scroll for events/clubs
- Create/Delete/View Clubs
  - Edit/Delete/Edit Clubs
  - Allow users to request clubs

### Excluded Features
- AI-Powered Chatbot for Instant Answers
  - Will be included in a later release

### Bug Fixes
- An account can now have multiple sessions
  - Fixed using Firebase settings

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
