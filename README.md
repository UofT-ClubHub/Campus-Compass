# Campus Compass

## Project Overview

Campus Compass is the ultimate discovery platform for University of Toronto's 99,794 students—a centralized hub where campus life comes alive. Whether you're searching for your next club to join, hunting for executive positions, or simply looking to stay in the loop, Campus Compass brings everything together in one seamless experience.

### What We Offer

**Discover & Connect**
- Browse 1,000+ student clubs across all three campuses: St. George, Scarborough, and Mississauga
- Advanced search and filtering by campus, department, and popularity
- Follow clubs to build a personalized feed tailored to your interests

**Events & Announcements**
- Explore a real-time feed of events, hiring opportunities, announcements, and surveys
- Interactive calendar integration to save events and never miss a deadline
- Filter by category, campus, or department to find exactly what you're looking for

**Recruitment Made Simple**
- Discover open positions at clubs across campus
- Apply directly through the platform with custom application forms
- Track your application status from submission to decision

**AI-Powered Assistant**
- Chat with our intelligent assistant powered by Google Gemini
- Get personalized club recommendations based on your interests
- Ask questions about events, deadlines, and opportunities in natural language

**For Club Leaders**
- Register and manage your club with a powerful executive dashboard
- Create and publish events, announcements, and job postings
- Track engagement with real-time analytics and follower insights
- Manage applications and recruit new members effortlessly

## Contribution Guidelines

### Ticketing Tool

-   We use **Jira** for tracking user stories, tasks, bugs, and feature requests.

### Branching Strategy

We follow a branching strategy inspired by **Git Flow**.

-   **`main`**: This branch represents the production-ready code.

-   **`develop`**: This is the primary development branch where all feature branches are merged.

-   **Feature Branches (`feat/<feature-name>`)**:
    -   Create a new branch from `develop` for each new feature or significant change.
    -   Once the feature is complete and tested, create a PR to merge it into `develop`.

-   **Bugfix Branches (`fix/<short-description>`)**:
    -   Create a new branch from `develop` to address bugs.
    -   Once the bug is fixed and verified, create a PR to merge it back into `develop`.

-   **Hotfix Branches (`hotfix/<short-description>`)**:
    -   Created from `main` for critical production bugs that need immediate attention.
    -   Once fixed, they are merged back into both `main` and `develop`.
