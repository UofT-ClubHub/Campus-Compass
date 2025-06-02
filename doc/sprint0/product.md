Campus Compass
With nearly 1,200 student clubs across the University of Toronto’s three campuses, discovering and engaging with campus life can quickly become overwhelming. As students ourselves, we’ve experienced how limited the opportunities are to explore what our university truly has to offer, often restricted to just one or two club fairs a year, which are packed with crowds and countless club booths that make the whole event just overwhelming. Even when students follow clubs they’re interested in, important posts often go unseen, buried in cluttered social media feeds or spread across disconnected platforms. To address this gap, we plan to build Campus Compass, a centralized, social media-inspired hub that provides UofT students with full visibility into all club-related activities. From event announcements and hiring calls to sign-up links and applications, Campus Compass ensures students stay informed and never miss out on opportunities to get involved.


Target Users
Our platform is built exclusively for the UofT community, with a userbase consisting of two key groups. On one end are UofT clubs, who use the platform to share event announcements, hiring opportunities, and general updates. On the other end are UofT students actively looking to get involved, stay informed, and explore extracurricular opportunities across all three campuses. By focusing solely on this ecosystem, Campus Compass ensures both groups are meaningfully connected through a centralized, purpose-built platform that supports student engagement beyond the limitations of occasional club fairs or scattered social media posts.

Campus Compass acts as an exclusive social media platform for UofT clubs and students, offering a familiar, interactive experience inspired by popular platforms like Instagram and Facebook. This makes it intuitive and engaging for our userbase while staying focused on campus-specific content. Once the UofT implementation is complete, we aim to expand Campus Compass to other universities and colleges, creating a broader network of campus-connected social platforms that support student engagement across institutions.

Feature Prioritization
Priority 1: Must Have
Automated Club Post Integration via Instagram Scraping
Campus Compass will feature automated content posting from club Instagram accounts using custom-built Instagram scrapers. These scrapers extract post images, captions, and hashtags, which are then passed through a Hugging Face text classification API to categorize each post (e.g., event, hiring, announcement). The classified data is stored in our database and displayed on our platform, eliminating the need for clubs to post manually. This ensures a constant stream of up-to-date content and gives visibility to all clubs. To fully automate this process, we’ll leverage GitHub Actions to run the scraper daily, keeping the platform consistently refreshed with the latest posts.


Priority 2: Should Have
Interactive Feed of Club Posts (Event Listings & Hiring Opportunities)
Inspired by social media, our feed lets students view categorized club posts, including event announcements and applications, directly within our platform. Posts link to external forms when needed, enabling users to sign up or apply seamlessly. 


Priority 3: Nice to Have
AI-Powered Chatbot for Instant Answers
To enhance convenience, Campus Compass will offer an AI chatbot that users can interact with for quick answers. For example, if a student forgets the time of an event they signed up for, they can ask the chatbot and receive an instant response. With this, there's no need to scroll through feeds or message club reps. This feature is designed to reduce friction in information retrieval and enhance the overall user experience.


Priority 4: Should Have
User Interaction & Club Engagement Analytics
Campus Compass will support two-way interaction between students and clubs through features such as liking posts, RSVPing to events, and registering directly through the platform via links to sign-up pages. These interactions provide students with an intuitive, engaging experience similar to other social platforms, while giving clubs valuable feedback on their outreach.

On the backend, clubs will have access to an analytics dashboard that tracks post performance metrics, including total likes, link click-through rates, and RSVP counts. These insights allow clubs to understand what types of posts resonate most with students, helping them optimize future content and event planning. By empowering clubs with data-driven feedback and giving students a more interactive experience, this feature strengthens the connection between both user groups and ensures the platform drives real, measurable engagement.


Priority 5: Should Have
Personalized Social Layer for Smart Recommendations
Campus Compass will offer a personalized discovery experience, including club follows and smart recommendations based on a student’s engagement history and interests. This tailored filtering system ensures each user sees the most relevant opportunities, creating a more engaging, student-specific experience.


Market Sizing & User Research Insights
In the 2023–2024 academic year, the University of Toronto recorded 99,794 enrolled students across its three campuses, alongside over 1,200 active student clubs. Despite this scale, there is currently no centralized, dedicated platform for clubs and students to consistently connect with. This creates a clear gap in visibility, access, and student engagement. As students often miss out on opportunities simply because they’re scattered across multiple platforms or lost in crowded social feeds.

Campus Compass addresses this by transforming fragmented student engagement into accessible, structured, and personalized club discovery, ensuring that no student misses out on what their campus community has to offer.
