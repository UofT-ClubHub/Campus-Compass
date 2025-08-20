# Assignment 2 Marking Scheme 50 marks
 
**Team Name:** Club Hub
**Github:** https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-c01s25-project-clubhub  
 
---

## System Design (PDF or MD file or another suitable format) (max 15 marks)

- Software Architecture Diagram & CI Workflow (max 10 marks)
  - 10 marks = The Architecture Diagram is present, it is formatted using proper graphic symbols. CI workflow is set up using GitAction with proper comments
  -  5 marks = The Architecture Diagram is present, it is not formatted well. CI workflow is set up but with no proper comments.
  -  0 marks = No diagram present or the presented document does not look like a software architecture diagram. No CI workflow set up.
 
Your Mark: 10

**Grader's Notes:**
- Very descriptive diagram illustrating user actions and triggers for CI/CD pipelines, really great work!
- Architecture and services used are described extensively in README.md

- Tasks Distribution (max 5 marks)
  - 5 marks  = every team member had at least one task assigned and completed
  - 4 marks  = every team member had at least one task assigned and made a pull request
  - 2 marks  = at least one team member did not complete any task or did not have any task assigned
  - 0 marks  = most of team members have no tasks assigned and/or completed
 
Your Mark: 5

**Grader's Notes:**
- From the GitHub commit history it looks like just one person worked on A2 by themselves.

## GitHub Review (Max 30 marks) 

### Working CICD pipeline (30 marks)

- 5 marks  = docker file(s) that that can meet all the project requirements and features
- 5 marks  = build docker image
- 5 marks  = Push Docker image to a container registry (e.g. DockerHub)
- 5 marks  = 3-5 Test Cases written for CI or CD
- 10 marks = Deployment of container image(s) on an orchestration framework (e.g. kubernetes) 
   
Your Mark: 30

**Grader's Notes:**
- Great work!
- Application deployed to EC2 instance and E2E tests are run against the deployed container successfully.
  - Very extensive tests btw good work!

## Documentation (max 5 marks)
 
- 5 marks = documentation has been created for all steps
- 3 mark = documentation has been created for some steps
- 0 marks = documentation has not been created
    
Your Mark: 5

**Grader's Notes:**
- Great documentation all throughout for each step of the pipeline.
  
## Total Mark


50 / 50
