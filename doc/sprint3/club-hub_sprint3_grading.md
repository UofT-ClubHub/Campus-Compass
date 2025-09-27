# Sprint 3 Marking Scheme

**Team Name:** Club Hub  
**Github:** https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub

---

## Version Control (max 5 marks)

- Consistent Usage of Git (2.5 pt):
  - 1 pts: Regular and consistent commits demonstrating incremental progress in the project.
  - 1 pt:  Demonstrated proficiency in basic Git commands (e.g., commit, push, pull, merge) and usage based on the contribution guidelines described by the team in their README.
  - 0.5 pts: Meaningful commit messages that convey the purpose of each change.

- Branches/Naming/Organization (2.5 pt)
  - 1 pts: Proper utilization of branches for feature development, bug fixes, etc. Should have feature branches for each user story that differs significantly in logic.
  - 1 pts: Use of Pull Requests and/or avoidance of direct uploads and merging zip files.
     - Should not directly commit each change to the main branch.
     - Should ideally merge branches using pull request feature on GitHub.
     - Should not manually merge zips from different branches in one local repo - bad practice
  - 0.5 pts: Clear and meaningful branch naming conventions that reflect the purpose of the branch.

Version Control Total Mark: 4.5 / 5

**Grader's Notes:**

- Some commit messages aren't detailed enough ("WIP", "Quickfixes in backend code", etc.)
  - You should try to always associate a JIRA ticket number with your commit messages, and if you can't, the message should at least describe what changes were being made.

——

## Code Quality (max 6 marks)

- Proper naming: 1 mark
- Indentation and spacing: 1 mark
- Proper use of comments: 1 mark
- Consistent coding style: 1.5 mark
- Code is easy to modify and re-use: 1.5 mark

Code Quality Total Mark: 5 / 6

**Grader's Notes:**

- The structure of your backend should be seperated into different layers (services, controllers, data-access, etc.) to make the project more modular.

——

## UI Design and Ease of Use (8 marks):
Visual Design/GUI (4 marks):

-	The UI demonstrates a cohesive and visually appealing design with appropriate color schemes, fonts, and visual elements: 1.5 mark
-	Consistent branding and styling are applied throughout the application and creative and thoughtful use of design elements that enhance the overall aesthetics: 1.5 mark
-	Intuitive navigation with clear and logically organized menus, buttons, or tabs: 1 mark
 
Ease of Use (4 marks):

-	Intuitiveness and simplicity in the user interactions, very minimal learning curve: 1.5 mark
-	Interactivity and Responsiveness: 1.5 mark
-	Clear and user-friendly error messages that guide users in resolving issues or success messages: 1 mark

UI Design and Ease of Use Total Mark: 8 / 8

——
## BackLog Management  (10 mark)

- Jira is used proficiently to manage user stories, tasks, and sprints.
- An even distribution of user stories across multiple sprints, not all in one sprint.
- An even distribution of user stories amongst group members.
- Completion and thoughtful organization of the Jira Board and Backlog
- Should use subtask/child issues feature to break down user stories instead of creating a large pool of unclassified tasks/user stories.
- Each user story / task in Sprint 2 has been assigned story estimation points.
- All tasks/user stories in Sprint 2 should be completed.

Note (for TAs): a completed sprint may be hidden from the Backlog/Board.

- You need to find/recover them manually.
- Do not deduct marks for completed sprints, therefore stories that disappeared.

Deduct 1/1.5 marks for each criteria violated.

Backlog Management Total Mark: 9 / 10

**Grader's Notes:**

- Some stories are not broken down into sub-tasks on JIRA.
  - For instance, https://clubhub2025.atlassian.net/browse/CW-29 can be broken down into (at least) 1 task for frontend, and 1 task for backend.

—

## Project Tracking (max 10 marks)

- Burndown chart is accurate, correctly reflecting tasks completed and remaining.
- The burndown smoothly tracks progress, reflecting team velocity and workload.
- Network diagram to show the critical path and documenting the findings in schedule.pdf
- Ideal vs. actual progress is clearly represented for comparison.

Deduct 2/2.5 marks for each criteria violated.

If the burndown chart is flat, no marks should be provided

Project Tracking Total Mark: 9 / 10

**Grader's Notes:**

- A part of the course learning is to make good use out of JIRA, so you shouldn't be starting the sprint without having stories already lined up on the board to complete.
  - You should have your stories estimated with story points and in the upcoming sprint before it even begins so all you need to do once the time comes to begin is start the sprint on JIRA.

---

## Planning Meetings (RPM.md, sprint1.md) (max 5 marks)

### RPM.md (Release Planning Meetings) (max 2.5 marks)

- 2.5 marks = Release goals are specified and there are sufficient references to included features, excluded features, bug fixes, non-functional requirement, dependency & limitation to be completed during the release
    
Deduct 0.5 marks for each criteria violated.
    
Your Mark: 2.5
    
### Sprint Planning meeting (sprint2.md) (max 2.5 marks)

- 2.5 marks = Meeting and sprint goal is documented, all spikes clearly identified, team capacity recorded, participants are recorded, everyone has participated, decisions about user stories to be completed this sprint are clear, tasks breakdown is done. 

Deduct 0.5  marks for each criteria violated.

Your Mark: 2.5 

Planning Meetings Total Mark: 5 / 5

—

---

## Team Communication (5 marks)

---

### Daily Stand-ups (max 3 marks)

- Team updates are done on the Slack server within your team's #standup channel
- Standup Format:
  [Standup Date] - Sprint # Standup #
  1. What did you work on since the last standup?
  2. What do you commit to next? 
  3. When do you think you'll be done?
  4. Do you have any blockers?
- Each group is required to post a minimum of 6 standups per sprint (Max 6 marks; 0.5 marks per daily standup)
- Standup updates answers the necessary questions and is good quality
  - 0.5 marks = All teams members have sent their updates in the channel and are well written/good quality. Each team member consistently addresses the above four questions:

Deduct 0.1 points for each standup missed for up to 0.5 point in total.
- For full marks, at least 6 standups need to be present.

Daily Stand-ups Total Mark: 3 / 3

### Sprint Retrospective (max 2 marks)

 - 2 marks = Includes a comprehensive review of what went well during the sprint, identifying specific examples of successes and effective practices.
  Proposes practical and realistic actions to address identified challenges and improve future sprints

Deduct 0.5 points for each criteria violated.

Sprint Retro Total Mark: 2 / 2

Team Communication Mark: 5 / 5

—

## NFR (max 14 marks)

- Well-structured, follows required format, and placed correctly in doc/sprint3 folder as NFR.pdf (3 marks)
- Clearly explains why the 3 NFRs were prioritized, with strong rationale and categorization, maligning with project needs (3 marks)
- Well-explained (min 2) trade-offs, highlighting benefits and reasoning behind choices. (2 marks)
- Includes detailed test results, best practices, and explanation implementation. 2 marks for each NFR implementation (6 marks)

Deduct marks if NFR are generic and not aligned with project goals and needs
  
NFR Implementation Total Mark: 8 / 14

**Grader's Notes:**

- In your top 3 NFRs, you mention that number 2 is Scalability, but the justification looks like it was meant for security instead.
- The trade-offs section was meant to be trade-offs for the application (i.e., focussing on maintainability instead of configurability, etc.) rather than what the team members themselves gave up in order to work on the project.
- Performance testing should test once with _x_ number of concurrent requests, then once more with _y_ number of concurrent requests to compare the results with each other, showing how the application performs under light, medium, and heavy loads.
- Although the documentation explains why your application is resilient to XSS and SQL injection, you're missing actual test results that support your theory (i.e., we manually tried to perform SQL (or noSQL) injection on this page and this is what happened, etc.)

—

## Unit Testing (max 12 marks)

- Covers all critical functions and edge cases. (3 marks)
- Tests are well-structured, modular, and maintainable. (3 marks)
- Thoroughly tests edge cases (boundary values, errors) (3 marks)
- Tests run successfully with clear output. (3 marks)

Unit Testing Total Mark: 10 / 12

**Grader's Notes:**

- Failing test cases indicate either poor design of the test case or poor design of the application.
  - If the test is meant to fail then it might not be useful and can be deleted.
  - More likely, you're testing that an error should be thrown and you aren't catching that error in your test properly, causing it to fail.
  - Either way, your documentation is vague and does not provide enough information as to why it is acceptable for this test to be failing.

---
## Sprint Demo (Max 17 marks) 

- Attendance (max 2.5 marks)
  - 2.5 marks = full team is present
  - 0.5 mark = one member is not present
  - 0 marks = more than one member is not present

- Working software (max 8 marks)
  - 8 marks = All 2 or 3 features presented work flawlessly
  - 1 mark removed for each bug/error identified or for missing records on JIRA

- UI Presentation (max 4 marks)
  - 4 marks = UI demonstrated is visually appealing and intuitive for users
  - 2 marks = one or more errors identified by the demo TA
  - 0 marks = UI is visually unappealing

- Presentation (max 2.5 marks)
  - 2.5 marks = Overall fluency in demonstrating software, speaking, and presenting ideas and technical
details. Comfortably answers any technical questions asked by TA

**Demo Notes:**
1. UI changes and major enhancements
  - Homepage has been implemented to show all of a user's clubs and all the clubs they follow
  - Homepage has bee entirely overhauled and revamped to be very modern
  - Added search optimization and persistant search using URL params on the frontend
  - 4 themes have been implemented to allow the user to customize their experience.
2. Club creation and deletion
  - Users can now request to create clubs on the site
  - These requests can be approved by admins of the site
  - When a request is rejected, it will be removed from the database
  - Approving will add the club to the page and set the requester an the first executive
3. Various smaller features and QOL enhancements
  - Download ICS file for event dates that can be added to the user's calendar
  - Club page is overhalued and looks very modern
  - Implemented responsive UI for mobile view

Your Mark: 17 / 17

## Total Mark

80.5 / 92