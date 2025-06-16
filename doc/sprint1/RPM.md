# Release Planning Meeting Document

## Release Plan

### Release Name: Sprint 1 Release

--- 

## Release Objectives



### Specific Goals
- Design & Implement database schema 
  - **Specific:** Create and design a databse that supports Users, Posts and Clubs
  - **Measurable:** Database is able to store Users, Posts and Clubs
  - **Achievable:** We have previous experience creating a database using Firebase
  - **Relevant:** Core requirement for our application to be able to create and search for Clubs/Posts
  - **Time-bound:** Complete within Sprint 1
- Implment a user authentication system
  - **Specific:**  Build registration, login and session handling
  - **Measurable:** System passes all of the authentication test cases when creating an account or logging in 
  - **Achievable:** We have prior experience handling authentication using Firebase
  - **Relevant:** Authentication is essential for controlling access and protecting data
  - **Time-bound:** Complete within Sprint 1

### Metrics for Measurement
- Successful user registration and login
- User feedback on design and ease of use
- Secure database access

## Release Scope

### Included Features
- Authentication
  - Implements secure Firebase authentication
- API Endpoints
  - GET, POST, PUT, DELETE endpoints for our api
- Clubs/Search Filtering
  - Using our endpoints, filter clubs/events stored in our database based on factors such as name, campus, description, etc
- Admin/Club Executive Page
  - Administrators will be able to add administrators/club executives to the database
  - Club Executives will be able to add more executives and post events 


### Excluded Features
- Automated Club Post Integration via Instagram Scraping
  - Will be included in a later release
- AI-Powered Chatbot for Instant Answers
  - Will be included in a later release
- User Interaction & Club Engagement Analytics
  - Will be included in a later release
- Personalized Social Layer for Smart Recommendations
  - Will be included in a later release

### Bug Fixes
- None, as this is the first release

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
- **Dependencies:** Firebase, Next.js, Tailwind CSS
- **Limititations:** 
  - Instagram has added additional security features that we have to work around
  - Limited functionality of the website due to the early stage of development

## Additional Thoughts on Considerations for Full Organizational Deployment

### Detailed Instruction - Steps to Carry Out the Deployment
- Ensure all dependencies are properlly installed
- Back up the database before deployment
- Perform a smoke test to verify proper functionality

### PIV (Post Implementation Verification) Instruction
- Perform tests to ensure proper functionality of features
- Check database integrity
- Confirm proper integration between front and back end
- Test key uesr flows such as user registration/login and club/post filtering


### Post Deployment Monitoring
- Track API response times and application loading times
- Monitor system logs for errors, crashes and unexpected behaviour

### Roll Back Strategy
- Keep a backup of previous versions
- Restore the latest database backup if data becomes corrupted