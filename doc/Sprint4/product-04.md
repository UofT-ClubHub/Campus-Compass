# 📍 Campus Compass

With nearly 1,200 student clubs across the University of Toronto’s three campuses, discovering and engaging with campus life can quickly become overwhelming. As students ourselves, we’ve experienced how limited the opportunities are to explore what our university truly has to offer—often restricted to just one or two club fairs a year, which are packed with crowds and countless club booths that make the whole event overwhelming.

Even when students follow clubs they’re interested in, important posts often go unseen—buried in cluttered social media feeds or spread across disconnected platforms.

To address this gap, we plan to build **Campus Compass**, a centralized, social media–inspired hub that provides UofT students with full visibility into all club-related activities. From event announcements and hiring calls to sign-up links and applications, Campus Compass ensures students stay informed and never miss out on opportunities to get involved.

---

## 👥 Target Users

Our platform is built exclusively for the **UofT community**, with a userbase consisting of two key groups:

- **UofT Clubs**: Use the platform to share event announcements, hiring opportunities, and general updates.
- **UofT Students**: Actively looking to get involved, stay informed, and explore extracurricular opportunities across all three campuses.

By focusing solely on this ecosystem, Campus Compass ensures both groups are meaningfully connected through a centralized, purpose-built platform that supports student engagement beyond the limitations of occasional club fairs or scattered social media posts.

---

Campus Compass acts as an **exclusive social media platform for UofT clubs and students**, offering a familiar, interactive experience inspired by platforms like Instagram and Facebook. This makes it intuitive and engaging for our userbase while staying focused on campus-specific content.

Once the UofT implementation is complete, we aim to **expand Campus Compass to other universities and colleges**, creating a broader network of campus-connected social platforms that support student engagement across institutions.

---

##  Feature Prioritization
---

### 🟢  Priority 1: Should Have  
**Automated Club Post Integration via Instagram Scraping**  
Campus Compass will feature automated content posting from club Instagram accounts using custom-built Instagram scrapers. These scrapers extract post images, captions, and hashtags, which are then passed through a Hugging Face text classification API to categorize each post (e.g., event, hiring, announcement).  

The data is then:
- Stored in our database  
- Displayed on our platform automatically  
- Kept fresh via GitHub Actions that run the scraper daily

This eliminates the need for manual club posting and ensures a constant stream of up-to-date content.

---

### 🟢 Priority 2: Should Have  
**Interactive Feed of Club Posts (Event Listings & Hiring Opportunities)**  
Inspired by social media, our feed allows students to view categorized club posts (e.g., events, applications) directly in-platform. Posts can link to external forms, enabling users to **sign up or apply** seamlessly.

---

### 🟢 Priority 3: Should Have  
**AI-Powered Chatbot for Instant Answers**  
Campus Compass features an AI assistant that gives users quick access to information from the database. The chatbot is run through Vertex AI (contrary to its name, it is not that AI but the platform that hosts/manages all the AI and ML models). The backend is comprised of gemini-2.5-flash-lite being the LLM, and through the use of a RAG system, gemini gains access to the firebase database and generates the responses based on the query and the data retrieved, and then the response is displayed in a instagram-like textbox..

---

### 🟢 Priority 4: Should Have  
**User Interaction & Club Engagement Analytics**  
Features include:  
- Liking posts  
- RSVPing to events  
- Registering via sign-up links
- Ability to request a new club as a user

Clubs will gain access to a **dashboard** tracking:
- Total likes  
- Link click-through rates  
- RSVP counts
- Executive portal showing all the clubs they are managing

This helps clubs understand what types of content engage students best and supports data-driven content strategy.

---

### 🟢 Priority 5: Should Have  
**Personalized Social Layer for Smart Recommendations**  
Students will receive personalized suggestions based on:
- Engagement history  
- Followed clubs  
- Interests
- Home screen provides events that users follow in an easy-to-view format
- Through the chatbot users can get personalized suggestions based off of their requests

This improves discoverability and makes the user experience **tailored and dynamic**.

---

## 📊 Market Sizing & User Research Insights

In the **2023–2024 academic year**, the University of Toronto recorded:
- **99,794 enrolled students**
- **1,200+ active student clubs**

Despite this scale, there is **no centralized platform** for clubs and students to connect. Opportunities are often lost due to:
- Scattered platforms
- Overcrowded feeds
- Limited club fairs

**Campus Compass** solves this by offering a:
- Centralized  
- Accessible  
- Personalized  

hub for all things club-related.

It transforms fragmented student engagement into a **structured, campus-specific experience**, ensuring that no student misses out on what their campus community has to offer.

Sources: https://www.utoronto.ca/about-u-of-t/quick-facts