# Sprint 1 Marking Scheme

**Team Name:** Club Hub

---

## Version Control (max 20 marks)

- Consistent Usage of Git (10 pt):
  - 4 pts: Regular and consistent commits demonstrating incremental progress in the project.
  - 4 pt: Demonstrated proficiency in basic Git commands (e.g., commit, push, pull, merge) and usage based on the contribution guidelines described by the team in their README.
  - 2 pts: Meaningful commit messages that convey the purpose of each change.

- Branches/Naming/Organization (10 pt)
  - 4 pts: Proper utilization of branches for feature development, bug fixes, etc. Should have feature branches for each user story that differs significantly in logic.
  - 4 pts: Use of Pull Requests and/or avoidance of direct uploads and merging zip files.
    - Should not directly commit each change to the main branch.
    - Should ideally merge branches using pull request feature on GitHub.
    - Should not manually merge zips from different branches in one local repo - bad practice
  - 2 pts: Clear and meaningful branch naming conventions that reflect the purpose of the branch.

Version Control Total Mark: 20 / 20

---

## Planning Meetings (RPM.md, sprint1.md) (max 10 marks)

- RPM.md (Release Planning Meetings) (max 5 marks)
  - 5 marks = Release goals are specified and there are sufficient references to included features, excluded features, bug fixes, non-functional requirement, dependency & limitation to be completed during the release

Deduct 1 marks for each criteria violated.

Your Mark: 5

- Sprint Planning meeting (sprint1.md) (max 5 marks)
  - 5 marks = Meeting and sprint goal is documented, all spikes clearly identified, team capacity recorded, participants are recorded, everyone has participated, decisions about user stories to be completed this sprint are clear, tasks breakdown is done.

Deduct 0.5/ 1 marks for each criteria violated.

Your Mark: 5

Planning Meetings Total Mark: 10 / 10

## BackLog Management (20 pts)

- Jira is used proficiently to manage user stories, tasks, and sprints.
- An even distribution of user stories across multiple sprints, not all in one sprint.
- An even distribution of user stories amongst group members.
- Completion and thoughtful organization of the Jira Board and Backlog
- Should use subtask/child issues feature to break down user stories instead of creating a large pool of unclassified tasks/user stories.
- Each task in Sprint 1 has been assigned story estimation points.
- All tasks/user stories in Sprint 1 should be completed.

Note (for TAs): a completed sprint may be hidden from the Backlog/Board. - You need to find/recover them manually. - Do not deduct marks for completed sprints, therefore stories that disappeared.

Deduct 2/2.5 marks for each criteria violated.

Backlog Management Total Mark: 20 / 20

---

## Team Communication (max 11 marks)

### Daily Stand-ups (max 6 marks)

- Team updates are done on the Slack server within your team's #standup channel
- Standup Format:
  [Standup Date] - Sprint # Standup #
  1. What did you work on since the last standup?
  2. What do you commit to next?
  3. When do you think you'll be done?
  4. Do you have any blockers?
- Each group is required to post a minimum of 6 standups per sprint (Max 6 marks; 1 marks per daily standup)
- Standup updates answers the necessary questions and is good quality
  - 1 marks = All teams members have sent their updates in the channel and are well written/good quality. Each team member consistently addresses the above four questions:

Deduct 0.2 points for each standup missed for up to 1 point in total. - For full marks, at least 6 standups need to be present.

Daily Stand-ups Total Mark: 6 / 6

### Sprint Retrospective (max 5 marks)

- 5 marks = Includes a comprehensive review of what went well during the sprint, identifying specific examples of successes and effective practices.
  Proposes practical and realistic actions to address identified challenges and improve future sprints

Deduct 1 points for each criteria violated.

Sprint Retro Total Mark: 5 / 5

Team Communication Mark: 11 / 11

---

## System Design (PDF or MD file or another suitable format) (max 15 marks)

Groups using React + Express and not relying on classes. Components can be treated as classes

- CRC Cards (or equivalent, if the team is not using CRC) (max 6 marks)
  - 6 marks = Class names and Collaborators have matching names and responsibilities are stated clearly
  - 4 marks = At least one of the class names does not match the collaborator names or the responsibilities for at least one class are unclear
  - 2 marks = Two class names do not match the collaborator names or the responsibilities of two or more classes are not stated or are unclear
  - 1 mark = The majority of class names do not match the collaborator names or the responsibilities of the majority of the classes are not stated or are unclear
  - 0 marks = No CRC provided or the provided document does not match the CRC model

Your Mark: 6

- Software Architecture Diagram (max 9 marks)
  - 9 marks = The Architecture Diagram is present, it is formatted using proper graphic symbols, and it follows a known Architecture diagram. Detailed description of the components as part of system decomposition
  - 5 marks = The Architecture Diagram is present, it is not formatted well, and it follows somewhat a known Architecture diagram. Some detailed description of the components as part of system decomposition
  - 3 marks = The Architecture Diagram is present, it is not formatted well, or it does not follow a known Architecture diagram. less description of the components as part of system decomposition
  - 1 mark = The Architecture Diagram is present, it is not formatted well, and it is unclear what Architecture it follows.
  - 0 marks = No diagram present or the presented document does not look like a software architecture diagram

Your Mark: 6

System Design Total Mark: 12 / 15

**Grader's Notes:**

- Architecture diagram is not formatted using proper graphic symbols.
- It's hard to tell the architecture of your system; does not follow a well known architecture diagram
  - Should introduce dotted lines to show seperation of components (frontend, backend, database, other external systems, etc.) for increased clarity.
- Good system decomposition

---

## Sprint Demo (Max 17 marks)

- Attendance (max 2.5 marks)
  - 2.5 marks = full team is present
  - (-0.5) mark = one member is not present
  - 0 marks = more than one member is not present

- Working software (max 8 marks)
  - 8 marks = All 2 or 3 features presented work flawlessly
  - 1 mark removed for each bug/error identified or for missing records on JIRA

- UI Presentation (max 4 marks)
  - 4 marks = UI demonstrated is visually appealing and intuitive for users
  - 2 marks = one or more errors identified by the demo TA
  - 0 marks = UI is visually unappealing

- Presentation (max 2.5 marks) - 2.5 marks = Overall fluency in demonstrating software, speaking, and presenting ideas and technical
  details. Comfortably answers any technical questions asked by TA

Your Mark: 17 / 17

**Demo Notes:**

1. Searching for clubs and posts and displaying

   - Upcomig events sorted by likes
   - Ability to search for clubs based name, description, and campus
   - Ability to view and search for posts

2. Club and user management

   - Can manage club and users in that club
   - Adding, removing users from a club
   - Admins manage the whole portal
   - Execs manage individual clubs

---

## Total Mark

90 / 93
