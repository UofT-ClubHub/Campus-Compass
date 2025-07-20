import { initializeApp } from 'firebase/app';
import { getVertexAI, getGenerativeModel } from '@firebase/vertexai-preview';
import { searchClubs, getClubDetails, searchPosts, getUpcomingEvents,
  getCategories, getCampuses, searchEvents, getEventLocation } from './functions';

// Firebase configuration using your project's config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: "https://clubhub-10e01-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-XSZBKS1H6K"
};

// Initialize Firebase and Vertex AI
const app = initializeApp(firebaseConfig);
const vertexAI = getVertexAI(app);
const model = getGenerativeModel(vertexAI, { model: 'gemini-1.5-flash' });

export class VertexChatbotService {
  async processMessage(message: string): Promise<{ message: string; data?: any }> {
    try {
      // Analyze the message and gather relevant data
      const context = await this.gatherContext(message);
      
      // Create the prompt for AI
      const prompt = this.createPrompt(message, context);
      
      // Use Firebase Vertex AI
      const result = await model.generateContent(prompt);
      const response = result.response;
      const responseText = response.text();
      
      return {
        message: responseText || "Sorry, I couldn't generate a response.",
        data: context.data
      };
      
    } catch (error) {
      console.error('AI error:', error);
      return {
        message: "I'm sorry, I encountered an error while processing your request. Please try again or ask for help! 🤖"
      };
    }
  }

  private async gatherContext(message: string): Promise<{ context: string; data: any }> {
    const lowerMessage = message.toLowerCase();
    let context = '';
    let data: any = {};

    // 1. Handle specific event location queries
    if (this.isLocationQuery(lowerMessage)) {
      const eventName = this.extractEventName(message);
      const campus = this.extractCampus(message);
      
      const events = await getEventLocation({ 
        eventQuery: eventName, 
        campus 
      });
      
      data.eventLocations = events;
      
      if (Array.isArray(events) && events.length > 0) {
        context += `Location information for "${eventName}":\n`;
        events.forEach((event: any, index: number) => {
          context += `${index + 1}. ${event.title || 'Event'}\n`;
          context += `   Date: ${event.date_occuring ? new Date(event.date_occuring).toLocaleDateString() : 'TBA'}\n`;
          context += `   Location: ${event.location || event.venue || event.address || 'Location TBA'}\n`;
          context += `   Campus: ${event.campus || 'Unknown'}\n\n`;
        });
      } else {
        context += `No location information found for "${eventName}". Try checking event details or contact organizers.\n\n`;
      }
    }

    // 2. Handle specific event date/time queries
    else if (this.isSpecificEventQuery(lowerMessage)) {
      const eventName = this.extractEventName(message);
      const campus = this.extractCampus(message);
      
      const events = await searchEvents({ 
        query: eventName, 
        campus, 
        includeExpired: false, 
        limit: 3 
      });
      
      data.specificEvents = events;
      
      if (Array.isArray(events) && events.length > 0) {
        context += `Found specific events matching "${eventName}":\n`;
        events.forEach((event: any, index: number) => {
          context += `${index + 1}. ${event.title || 'Event'}\n`;
          context += `   Date: ${event.date_occuring ? new Date(event.date_occuring).toLocaleDateString() : 'TBA'}\n`;
          context += `   Time: ${event.date_occuring ? new Date(event.date_occuring).toLocaleTimeString() : 'TBA'}\n`;
          context += `   Campus: ${event.campus || 'Unknown'}\n`;
          context += `   Details: ${event.details || 'No details available'}\n\n`;
        });
      } else {
        context += `No events found matching "${eventName}". Try checking upcoming events or different keywords.\n\n`;
      }
    }

    // 3. Handle general club searches
    else if (this.isClubRelated(lowerMessage)) {
      const query = this.extractQuery(message);
      const campus = this.extractCampus(message);
      
      const clubs = await searchClubs({ query, campus, limit: 5 });
      data.clubs = clubs;
      
      if (Array.isArray(clubs) && clubs.length > 0) {
        context += `Found ${clubs.length} clubs matching "${query}"${campus ? ` at ${campus}` : ''}:\n`;
        clubs.forEach((club: any, index: number) => {
          context += `${index + 1}. ${club.name} (${club.campus || 'Unknown campus'})\n`;
          context += `   Description: ${club.description || 'No description available'}\n`;
          if (club.instagram) {
            context += `   Instagram: ${club.instagram}\n`;
          }
          if (club.links) {
            context += `   Links: ${JSON.stringify(club.links)}\n`;
          }
          context += '\n';
        });
      } else {
        context += `No clubs found matching "${query}"${campus ? ` at ${campus}` : ''}.\n\n`;
      }
    }

    // 4. Handle general upcoming events
    else if (this.isEventRelated(lowerMessage)) {
      const campus = this.extractCampus(message);
      const daysAhead = this.extractDaysAhead(message);
      const events = await getUpcomingEvents({ campus, daysAhead });
      data.events = events;
      
      if (Array.isArray(events) && events.length > 0) {
        context += `Found ${events.length} upcoming events${campus ? ` at ${campus}` : ''} in the next ${daysAhead} days:\n`;
        events.forEach((event: any, index: number) => {
          context += `${index + 1}. ${event.title || 'Event'}\n`;
          context += `   Date: ${event.date_occuring ? new Date(event.date_occuring).toLocaleDateString() : 'Date TBA'}\n`;
          context += `   Details: ${event.details || 'No details available'}\n`;
          context += `   Campus: ${event.campus || 'Unknown'}\n\n`;
        });
      } else {
        context += `No upcoming events found${campus ? ` at ${campus}` : ''} in the next ${daysAhead} days.\n\n`;
      }
    }

    // 5. Handle post searches
    else if (this.isPostRelated(lowerMessage)) {
      const query = this.extractQuery(message);
      const campus = this.extractCampus(message);
      const category = this.extractCategory(message);
      
      const posts = await searchPosts({ query, campus, category, limit: 5 });
      data.posts = posts;
      
      if (Array.isArray(posts) && posts.length > 0) {
        context += `Found ${posts.length} posts matching "${query}":\n`;
        posts.forEach((post: any, index: number) => {
          context += `${index + 1}. ${post.title || 'Post'}\n`;
          context += `   Category: ${post.category || 'General'}\n`;
          context += `   Campus: ${post.campus || 'Unknown'}\n`;
          context += `   Details: ${post.details || 'No details available'}\n\n`;
        });
      } else {
        context += `No posts found matching "${query}".\n\n`;
      }
    }

    // 6. Handle general info requests
    else if (this.isGeneralInfo(lowerMessage)) {
      const campuses = getCampuses();
      const categories = await getCategories();
      data.campuses = campuses;
      data.categories = categories;
      
      context += `ClubHub Information:\n`;
      context += `Available campuses: ${campuses.join(', ')}\n`;
      context += `Available post categories: ${categories.join(', ')}\n\n`;
    }

    return { context, data };
  }

  private createPrompt(message: string, contextData: { context: string; data: any }): string {
    return `You are ClubHub Assistant, a helpful and friendly AI chatbot for the ClubHub university club management platform at the University of Toronto.

Your role:
- Help students find clubs, events, and posts across three campuses: UTSG (St. George downtown), UTM (Mississauga), and UTSC (Scarborough)
- Provide accurate information based on the database context provided below
- Be conversational, helpful, and encouraging
- Use emojis occasionally to make responses engaging (but not too many!)
- Format responses clearly with bullet points, lists, or sections when appropriate
- Always be positive and student-focused

Guidelines:
- Always base your answers on the provided context data
- If no relevant data is found, suggest alternatives or provide helpful guidance
- Encourage users to visit club pages or contact clubs directly for more details
- Be specific about dates, locations, and contact information when available
- If users ask about joining clubs, suggest they check the club's contact information
- Keep responses concise but informative
- Use natural, friendly language

Context from ClubHub database:
${contextData.context || 'No specific data found for this query.'}

User question: ${message}

Please provide a helpful, well-formatted response based on the context above. If no data was found, offer suggestions for what the user can try instead.`;
  }

  // Intent detection methods
  private isLocationQuery(message: string): boolean {
    const locationKeywords = [
      'where', 'location', 'venue', 'address', 'room', 'building', 'place'
    ];
    return locationKeywords.some(keyword => message.includes(keyword)) && 
           (message.includes('event') || message.includes('meeting') || message.includes('happening'));
  }

  private isSpecificEventQuery(message: string): boolean {
    const specificEventPhrases = [
      'when does', 'when is', 'what time', 'date of', 'schedule for', 'time of'
    ];
    return specificEventPhrases.some(phrase => message.includes(phrase));
  }

  private isClubRelated(message: string): boolean {
    const clubKeywords = ['club', 'clubs', 'organization', 'organizations', 'society', 'societies', 'group', 'groups'];
    return clubKeywords.some(keyword => message.includes(keyword));
  }

  private isEventRelated(message: string): boolean {
    const eventKeywords = ['event', 'events', 'happening', 'upcoming', 'activities', 'activity'];
    return eventKeywords.some(keyword => message.includes(keyword));
  }

  private isPostRelated(message: string): boolean {
    const postKeywords = ['post', 'posts', 'announcement', 'announcements', 'news', 'update', 'updates', 'hiring', 'job', 'opportunity'];
    return postKeywords.some(keyword => message.includes(keyword));
  }

  private isGeneralInfo(message: string): boolean {
    const generalKeywords = ['help', 'campus', 'campuses', 'what', 'how', 'categories', 'options', 'about', 'info'];
    return generalKeywords.some(keyword => message.includes(keyword)) || message.length < 15;
  }

  // Data extraction methods
  private extractQuery(message: string): string {
    const words = message.toLowerCase().split(' ');
    const stopWords = [
      'what', 'is', 'are', 'the', 'find', 'search', 'for', 'about', 'show', 'me', 
      'at', 'in', 'on', 'can', 'you', 'i', 'want', 'to', 'looking', 'any', 'some'
    ];
    return words.filter(word => !stopWords.includes(word) && word.length > 2).join(' ');
  }

  private extractEventName(message: string): string {
    const cleanMessage = message.toLowerCase()
      .replace(/where\s+is|what\s+is\s+the\s+location|location\s+of|when\s+does|when\s+is|what\s+time/gi, '')
      .replace(/\?/g, '')
      .trim();
    
    const words = cleanMessage.split(' ')
      .filter(word => !['the', 'a', 'an', 'is', 'where', 'when', 'location', 'venue', 'happen', 'happening'].includes(word));
    
    return words.join(' ').trim();
  }

  private extractCampus(message: string): string | undefined {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('utsg') || lowerMessage.includes('st. george') || lowerMessage.includes('st george') || lowerMessage.includes('downtown')) {
      return 'UTSG';
    }
    if (lowerMessage.includes('utm') || lowerMessage.includes('mississauga')) {
      return 'UTM';
    }
    if (lowerMessage.includes('utsc') || lowerMessage.includes('scarborough')) {
      return 'UTSC';
    }
    return undefined;
  }

  private extractCategory(message: string): string | undefined {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('hiring') || lowerMessage.includes('job') || lowerMessage.includes('opportunity')) {
      return 'Hiring Opportunity';
    }
    if (lowerMessage.includes('event')) return 'Event';
    if (lowerMessage.includes('announcement')) return 'Announcement';
    if (lowerMessage.includes('general')) return 'General';
    return undefined;
  }

  private extractDaysAhead(message: string): number {
    const match = message.match(/(\d+)\s*days?/);
    if (match) return parseInt(match[1]);
    
    if (message.includes('today') || message.includes('tonight')) return 1;
    if (message.includes('tomorrow')) return 2;
    if (message.includes('week') || message.includes('7 days')) return 7;
    if (message.includes('month') || message.includes('30 days')) return 30;
    
    return 7; // Default to 7 days
  }
}