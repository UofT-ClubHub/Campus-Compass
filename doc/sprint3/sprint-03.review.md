# ClubHub

## Iteration 03 - Review & Retrospect

 * When: 20/07/2025
 * Where: ONLINE

## Process - Reflection

#### Decisions that turned out well

List process‑related (i.e. team organization) decisions that, in retrospect, turned out to be successful.

* Teamwork / Wokring in Pairs/Groups: Unit testing (like backend and frontend testing) was way to tedious for one person. Working together reduced the strain and workload that initially one person had to do, and produced higher‑coverage tests.
* Planning out a proper outline for completion of tasks: Previously we would populate Jira and ask members what tasks they wanted to do. After now having some expereince with the past sprints and with this being our last sprint we were able to delegate the remaining tasks efficently with everyone knowing what needs to be done by the end of the sprint, and understanding where we wanted our project to be at by the end of the sprint.

#### Decisions that did not turn out as well as we hoped

List process‑related (i.e. team organization) decisions that, in retrospect, were not as successful as you thought they would be.

* Underestimating the size of certain tasks:  we mis-judged how time-consuming “simple” items like writing comprehensive unit tests would be. Which turned out to be very challenging for one person to do.
* Skipped time‑blocking & task follow‑ups: Busy schedules meant rushed stand‑ups and some low‑priority tasks being sidelined or forgotten.

#### Planned changes

List any process‑related changes you are planning to make (if there are any)

 * Group Planning Sessions for Difficult Tasks: A quick, high‑level whiteboard session before coding will guide the task owner without removing the challenge of implementation details.
 * Strict Time‑Blocking / Deep‑Work Windows: Each member commits to at least two 2‑hour focused ClubHub blocks per week to raise team‑wide efficiency.
 * Lightweight Mid‑Sprint Status Ping: The PM will post a checklist mid‑sprint so forgotten tasks surface early.

## Product - Review

#### Goals and/or tasks that were met/completed:

* redesigned home page:
  <https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/blob/develop/clubhub-web/src/app/page.tsx>
* Club Page displaying all posts relating to the club: 
  <https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/tree/develop/clubhub-web/src/app/clubPage/%5BclubID%5D>  
  <https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/blob/develop/clubhub-web/src/app/clubPage/%5BclubID%5D/page.tsx>
* Persistent URL for clubs and posts: 
  <https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/blob/develop/clubhub-web/src/app/clubSearch/page.tsx>
  <https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/blob/develop/clubhub-web/src/app/postFilter/page.tsx>
* auto carousel displaying clubs and upcoming events:  
  <https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/blob/develop/clubhub-web/src/app/page.tsx>
* Club request form: <https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/blob/develop/clubhub-web/src/app/pending-club-request/page.tsx>

#### Goals and/or tasks that were planned but not met/completed:

* AI Chatbot: The basic Firebase AI Logic demo works locally, but responses aren’t production‑ready; we’ll keep refining it next sprint.

## Meeting Highlights

Going into the next iteration, our main insights are:

* **Finish & polish the chatbot** – train it on club/event data, ensure answers are relevant, and display citations.
* **Visual polish & motion** – use Framer Motion and improved colour/typography to make the site more appealing.
* **Responsive mobile view** – verify every page works on a mobile screen; fix overflow issues.
* **Deployment** – set up Vercel or Firebase Hosting so stakeholders can test a live URL.
