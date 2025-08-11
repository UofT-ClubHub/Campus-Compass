# Sprint 4 Marking Scheme

Marking theme for this sprint:

- All required features specified in the initial project scope are implemented and work correctly.
- User interface is intuitive, responsive, and user-friendly
- Input validation, error messages, and fallback mechanisms are implemented for all features
- Seamless connection between front-end and back-end; API routes work as intended
- Clean, modular, well-organized code; proper use of functions, classes, and file structure.

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


Version Control Total Mark: 5 / 5

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
- Each user story / task in Sprint 4 has been assigned story estimation points.
- All tasks/user stories in Sprint 4 should be completed.

Note: For this sprint , all the JIRA stories should be completed and nothing should remain in-progress. Deduct marks for stories partially completed

Deduct 1/1.5 marks for each criteria violated.

Backlog Management Total Mark: 10 / 10

**Grader's Notes:**
- Great work!

—

## Project Tracking (max 10 marks)

- Burndown chart is accurate, correctly reflecting tasks completed and remaining.
- The burndown smoothly tracks progress, reflecting team velocity and workload.
- Network diagram to show the critical path and documenting the findings in schedule.pdf
- Ideal vs. actual progress is clearly represented for comparison.

Deduct 2/2.5 marks for each criteria violated.

If the burndown chart is flat, no marks should be provided

Project Tracking Total Mark: 5 / 10

**Grader's Notes:**
- Even if you have to do things like create designs, stabilize dependencies, you should stil create tickets for those to track them on your board.
  - JIRA is meant to track all the progress made on your app, regardless of whether or not it involes any code.
- The explanation provided also does not explain the sudden spike then drop at the end of the sprint.

---

## Planning Meetings (RPM.md, sprint1.md) (max 5 marks)

- RPM.md (Release Planning Meetings) (max 2.5 marks)
  - 2.5 marks = Release goals are specified and there are sufficient references to included features, excluded features, bug fixes, non-functional requirement, dependency & limitation to be completed during the release
    
Deduct 0.5 marks for each criteria violated.
    
Your Mark: 2.5
    
- Sprint Planning meeting (sprint2.md) (max 2.5 marks)
  - 2.5 marks = Meeting and sprint goal is documented, all spikes clearly identified, team capacity recorded, participants are recorded, everyone has participated, decisions about user stories to be completed this sprint are clear, tasks breakdown is done. 

Deduct 0.5  marks for each criteria violated.

Your Mark: 2.5 

Planning Meetings Total Mark: 5 / 5

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

Daily Stand-ups Total Mark: 2.4 / 3

**Graders Notes:**
- In sprint 4, you had the following standups:

  1. July 21st: Missing 4 people (-0.4)
  2. July 22nd: Missing 1 person (-0.1)
  3. July 29th: All accounted for.
  4. July 30th: Missing 1 person (-0.1)
  5. July 31st: All accounted for.
  6. August 1st: All accounted for.


### Sprint Retrospective (max 2 marks)

- 2 marks = Includes a comprehensive review of what went well during the sprint, identifying specific examples of successes and effective practices.
          Proposes practical and realistic actions to address identified challenges and improve future sprints

Deduct 0.5 points for each criteria violated.

Sprint Retro Total Mark: 2 / 2


Team Communication Mark: 4.4 / 5

—

## Unit Testing (max 12 marks)

- Covers all critical functions and edge cases. (3 marks)
- Tests are well-structured, modular, and maintainable. (3 marks)
- Thoroughly tests edge cases (boundary values, errors) (3 marks)
- Tests run successfully with clear output. (3 marks)

Unit Testing Total Mark: 10 / 12

- Your playwright tests should be invoked seperately from your Jest tests. When I ran `npm test`, both playwright and jest ran at the same time and the playwright ones failed.

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

Your Mark: 17 / 17

**Demo Notes:**
1. Chat bot implementation
   1. Users can talk to a chat bot to be able to get some quick information about the site, the types of clubs offered, etc.
   2. Questions can range from broad ones like what clubs there are and can be more specific, "what are some cs clubs at UTSC"
   3. LLM on the backend retrieves the required data then produces a response based on the provided context.
      1. Using Gemini 2.5 Flash Lite
2. Added club requests
   1. Students can now request clubs to be directly on the site
   2. Students can view feedback from the admins
3. Club executives can manage their links
   1. Execs can manage their links on their site
   2. They add, update, and remove links on the page.
4. Scraper is now automated and running in the background rather than manual
   1. This scraper runs at 12am once every day scraping on post per club.
5. Various backend optimizations
   1. Returns firebase links instead of the direct image from the backend for efficiency

## Total Mark

69.4 / 78