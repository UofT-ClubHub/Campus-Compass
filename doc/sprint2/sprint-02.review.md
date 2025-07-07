# ClubHub


## Iteration 02 - Review & Retrospect

 * When: 08/07/2025
 * Where: ONLINE

## Process - Reflection

#### Decisions that turned out well

List process-related (i.e. team organization) decisions that, in retrospect, turned out to be successful.

* Teamwork: Being able to help each other out when people were struggling or needed the extra help fostered a more comfortable environment to work in, and ensured all work was completed in a timely manner.
* Appropriate Response Time for Communication: Being quick to reply on places such as Slack allowed the group to keep track of everyone's work, and allowed everyone to be on the same page throughout the sprint.
* Working in Pairs/Groups: This was done when a member had a task that required information on the implementation of another task. Teamming up with the other member and wokring together to plan how the 2 tasks could be implemented seamlessly mitigated the risks of merge conflicts or any logical/UI conflicts that could occur after merging everything together.

#### Decisions that did not turn out as well as we hoped

List process-related (i.e. team organization) decisions that, in retrospect, were not as successful as you thought they would be.

* Allowing members to implement the solution they deemed adequate for their tasks (and not planning the solution as a group)
* Not Time Blocking

#### Planned changes

List any process-related changes you are planning to make (if there are any)

 * Group Planning Sessions for Difficult Tasks: This would guide the task owner on the route to go down when implementing their solution. This would still allow the task owner to be challenged since the planning session would be very high level, allowing the task owner to still figure out how they would like to solve the problem at hand.
 * Being more Efficient: Although there were no major issues caused by inefficiency, we should strive to complete more work than we first planned for within the sprint, and this can only be done at max efficiency levels. Utilizing a method such as time blocking can ensure the team is as efficient as possible.


## Product - Review

#### Goals and/or tasks that were met/completed:

* Instagram Scraper and Text Classification (https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/tree/feat/instaScraper/clubhub-bot)
* Expandable Club Card and Post Card Components (and Edit and Delete Functionalities) (https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/blob/develop/clubhub-web/components/expandable-club-card.tsx) and (https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/blob/develop/clubhub-web/components/expandable-post-card.tsx)
* User Profile Page (https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/blob/feat/user-profile/clubhub-web/src/app/profile/page.tsx)
* API Endpoint Authorization (https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/blob/feat/authorization/clubhub-web/src/app/api/clubs/route.ts) and (https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/blob/feat/authorization/clubhub-web/src/app/api/users/route.ts)
and (https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/blob/feat/authorization/clubhub-web/src/app/api/amenities.ts)
* Infinite Scrolling Feature (https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/blob/eishan/feat/infiniteScroll/clubhub-web/src/app/clubSearch/page.tsx) and (https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/blob/eishan/feat/infiniteScroll/clubhub-web/src/app/postFilter/page.tsx)
* AutoSearch (https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/blob/eishan/feat/infiniteScroll/clubhub-web/src/app/clubSearch/page.tsx) and (https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub/blob/eishan/feat/infiniteScroll/clubhub-web/src/app/postFilter/page.tsx)

#### Goals and/or tasks that were planned but not met/completed:

 * All items we planned to do for this sprint were completed.

## Meeting Highlights

Going into the next iteration, our main insights are:

* Creating and utilizing unit tests and other other types of tests (like performance or funcitonal test cases) will ensure our website works in a maltitude of ways and does not break in unique scenarios. Creating test cases allows us to automate the process of testing, rather than manually testing the behaviours by hand. Doing so can ensure our website works as wanted at all stages during its development.
* Implementing an AI Chatbot. This will give users more flexibility on finding information about different clubs or events. We will use a Firebase extension (Firebase AI Logic) to implement the functionalities as our first option. If that doesn't work, then we will look into using some other API's. 
* Create new pages for increasing the useability on our website. Pages to display all the club posting that a user follows, or seeing all the posts related to a specific club will be created ensuring our website is more well-rounded and useable by the mass public. Implementation of this will follow similarly to pages we have already done, utilizing components we have already created to ensure consistency.


