# Campus Compass

## Project Overview

Campus Compass is a social-media-style hub for U of T’s 99,794 students where student leaders can register new clubs and post events or announcements directly to a campus-wide feed. Complementing these manual posts, the platform scrapes Instagram content from existing club accounts, classifies each post with an NLP model, and uses GitHub Actions to refresh the feed daily, so no opportunity slips through the cracks. Students browse a familiar timeline, RSVP or apply in one tap, and chat with an AI assistant for quick answer, while clubs track sign-ups through real-time analytics—turning fragmented campus life into one always-on discovery platform.

## Installation Instructions

### Prerequisites

- Node.js
- npm
- Firebase account

### Web Application (`clubhub-web`)

1.  **Navigate to the web application directory:**
    ```bash
    cd clubhub-web
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the `clubhub-web` directory and add your Firebase configuration.
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=""
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
    NEXT_PUBLIC_FIREBASE_DATABASE_URL=""
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
    NEXT_PUBLIC_FIREBASE_APP_ID=""
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    
    #### The application will now be available at `http://localhost:3000`.

### Bot (`clubhub-bot`)

(Instructions for the bot will be added here once the bot development is further along.)

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

## MVP Setup

- For this project, we are using Next.js for both the frontend and backend, Firebase Database for storage, and GitHub Actions with Python for the bots. We will be following the MVP (Model-Controller-View) setup:

- The model is defined in `clubhub-web/src/model`, setting up a client for the Firebase cloud database that we are using.

- The controllers are defined in `clubhub-web/src/app/api`, and are used to interact with the client, performing CRUD operations.
    - The basic GET endpoints have been set up for each of the database collections: Clubs, Posts, Users

- The view is defined in `clubhub-web/src/app` using `.tsx` (Typescript) files.
    - An authentication page has been set up in `clubhub-web/src/app/auth` where users can sign up, log in, or reset their passwords.
