import { initializeApp } from 'firebase/app';
import { getVertexAI, getGenerativeModel } from '@firebase/vertexai-preview';
import { getAuth, signInAnonymously } from 'firebase/auth';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Vertex AI after authentication
let vertexAI: any = null;
let model: any = null;

// Test Mode (Just keep using this since we want it to be available to everyone
// regardless of authentication)
async function ensureAuthenticated() {
  // Test mode for development - add this to your .env.local: CHATBOT_TEST_MODE=true
  const isTestMode = process.env.CHATBOT_TEST_MODE === 'true';
  
  if (isTestMode) {
    console.log('🧪 Running in test mode - bypassing authentication');
  } else {
    // Check if user is already signed in (no anonymous sign-in)
    if (!auth.currentUser) {
      throw new Error('User must be signed in to use the chatbot. Please log in first.');
    }
    console.log('User authenticated:', auth.currentUser.email || auth.currentUser.uid);
  }
  
  if (!vertexAI) {
    vertexAI = getVertexAI(app);
    model = getGenerativeModel(vertexAI, { model: 'gemini-2.5-flash-lite' });
  }
}

export class VertexChatbotService {
  async processMessage(message: string): Promise<{ message: string; data?: any }> {
    try {
      // Ensure we're authenticated before making AI calls
      await ensureAuthenticated();
      
      // Analyze the message and gather relevant data
      const context = await this.gatherContext(message);
      
      // Create the prompt for AI
      const prompt = this.createPrompt(message, context);
      
      // Use Firebase Vertex AI (now with authentication)
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
        message: "I'm sorry, I encountered an error while processing your request. Please try again or ask for help!"
      };
    }
  }

  private async gatherContext(message: string): Promise<{ context: string; data: any }> {
    const lowerMessage = message.toLowerCase();
    let context = '';
    let data: any = {};

    // Handles greetings
    if (this.isGreeting(lowerMessage)) {
        context += `User is greeting the chatbot. Respond in a friendly, welcoming way and offer to help with ClubHub.\n`;
        context += `Available services: club search, event information, post discovery across UTSG, UTM, and UTSC campuses.\n\n`;
        data.greeting = true;
        return { context, data };
    }

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

    // 3. Handle general club searches - ENHANCED WITH MULTIPLE SEARCH STRATEGIES
    else if (this.isClubRelated(lowerMessage)) {
      const query = this.extractQuery(message);
      const campus = this.extractCampus(message);

      console.log('🔍 Club Search Debug:');
      console.log('  Original message:', message);
      console.log('  Extracted query:', query);
      console.log('  Extracted campus:', campus);

      // Try multiple search strategies to find clubs
      let clubs = await this.performComprehensiveClubSearch(query, campus, lowerMessage);

      console.log('🔍 Final Club Search Results:');
      console.log('  Found clubs:', clubs);

      data.clubs = clubs;
      
      if (Array.isArray(clubs) && clubs.length > 0) {
        // Filter and rank results by relevance
        const rankedClubs = clubs
          .map((club: any) => ({
            ...club,
            relevanceScore: this.calculateRelevanceScore(club, query.toLowerCase())
          }))
          .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
          .slice(0, 6); // Take top 6 most relevant

        context += `Found ${rankedClubs.length} clubs from ClubHub database${campus ? ` at ${campus}` : ''}:\n`;
        rankedClubs.forEach((club: any, index: number) => {
          context += `${index + 1}. ${club.name} (${club.campus || 'Unknown campus'})\n`;
          context += `   Description: ${club.description || 'No description available'}\n`;
          
          if (club.instagram) {
            context += `   Instagram: ${club.instagram}\n`;
          }
          if (club.email) {
            context += `   Email: ${club.email}\n`;
          }
          if (club.links) {
            context += `   Links: ${JSON.stringify(club.links)}\n`;
          }
          context += '\n';
        });
        
        // Add helpful database-driven suggestions
        context += `\nTip: For more clubs, try searching for related terms or check different campuses in ClubHub!\n\n`;
        
      } else {
        // Enhanced no-results response with database-first approach
        context += `No clubs found in ClubHub database matching "${query}"${campus ? ` at ${campus}` : ''}.\n\n`;
        context += `Suggestions for finding clubs in ClubHub:\n`;
        context += `• Try broader search terms (e.g., "tech" instead of "software engineering")\n`;
        context += `• Search without specifying a campus to see all options\n`;
        context += `• Use different keywords related to your interests\n`;
        context += `• Check if clubs might be listed under different categories\n\n`;
        
        // Suggest related searches
        if (lowerMessage.includes('computer') || lowerMessage.includes('cs') || lowerMessage.includes('programming')) {
          context += `Try searching ClubHub for: "tech", "engineering", "science", or "programming"\n\n`;
        }
      }
    }

    // 4. Handle general upcoming events - ENHANCED
    else if (this.isEventRelated(lowerMessage)) {
      const campus = this.extractCampus(message);
      const daysAhead = this.extractDaysAhead(message);
      
      console.log('🔍 Event Search Debug:');
      console.log('  Campus:', campus);
      console.log('  Days ahead:', daysAhead);
      
      const events = await getUpcomingEvents({ campus, daysAhead });
      data.events = events;
      
      if (Array.isArray(events) && events.length > 0) {
        context += `Found ${events.length} upcoming events in ClubHub database${campus ? ` at ${campus}` : ''} in the next ${daysAhead} days:\n`;
        events.forEach((event: any, index: number) => {
          context += `${index + 1}. ${event.title || 'Event'}\n`;
          context += `   Date: ${event.date_occuring ? new Date(event.date_occuring).toLocaleDateString() : 'Date TBA'}\n`;
          context += `   Time: ${event.date_occuring ? new Date(event.date_occuring).toLocaleTimeString() : 'Time TBA'}\n`;
          context += `   Campus: ${event.campus || 'Unknown'}\n`;
          context += `   Details: ${event.details || 'No details available'}\n`;
          
          if (event.location) {
            context += `   Location: ${event.location}\n`;
          }
          context += '\n';
        });
        
        context += `\nTip: Check ClubHub regularly for new events and updates!\n\n`;
      } else {
        context += `No upcoming events found in ClubHub database${campus ? ` at ${campus}` : ''} in the next ${daysAhead} days.\n\n`;
        context += `Suggestions:\n`;
        context += `• Try expanding your search to more days ahead\n`;
        context += `• Check different campuses (UTSG, UTM, UTSC)\n`;
        context += `• Look for events in ClubHub's event section\n`;
        context += `• Follow clubs you're interested in for event notifications\n\n`;
      }
    }

    // 5. Handle post searches - ENHANCED
    else if (this.isPostRelated(lowerMessage)) {
      const query = this.extractQuery(message);
      const campus = this.extractCampus(message);
      const category = this.extractCategory(message);
      
      console.log('🔍 Post Search Debug:');
      console.log('  Query:', query);
      console.log('  Campus:', campus);
      console.log('  Category:', category);
      
      const posts = await searchPosts({ query, campus, category, limit: 8 });
      data.posts = posts;
      
      if (Array.isArray(posts) && posts.length > 0) {
        context += `Found ${posts.length} posts in ClubHub database matching "${query}":\n`;
        posts.forEach((post: any, index: number) => {
          context += `${index + 1}. ${post.title || 'Post'}\n`;
          context += `   Category: ${post.category || 'General'}\n`;
          context += `   Campus: ${post.campus || 'Unknown'}\n`;
          context += `   Details: ${post.details || 'No details available'}\n`;
          
          if (post.date_created) {
            context += `   Posted: ${new Date(post.date_created).toLocaleDateString()}\n`;
          }
          context += '\n';
        });
        
        context += `\nTip: Check ClubHub posts section for the latest updates and opportunities!\n\n`;
      } else {
        context += `No posts found in ClubHub database matching "${query}".\n\n`;
        context += `Try searching with different keywords or check the ClubHub posts section directly.\n\n`;
      }
    }

    // 6. Handle general info requests - ENHANCED WITH DATABASE STATS
    else if (this.isGeneralInfo(lowerMessage)) {
      const campuses = getCampuses();
      const categories = await getCategories();
      
      // Get some sample data to show what's available
      const sampleClubs = await searchClubs({ query: '', limit: 3 });
      const sampleEvents = await getUpcomingEvents({ daysAhead: 30 });
      
      data.campuses = campuses;
      data.categories = categories;
      data.sampleClubs = sampleClubs;
      data.sampleEvents = sampleEvents;
      
      context += `ClubHub Platform Information:\n`;
      context += `Available campuses: ${campuses.join(', ')}\n`;
      context += `Available post categories: ${categories.join(', ')}\n\n`;
      
      if (sampleClubs && sampleClubs.length > 0) {
        context += `Currently tracking ${sampleClubs.length}+ clubs across all campuses\n`;
      }
      
      if (sampleEvents && sampleEvents.length > 0) {
        context += `${sampleEvents.length}+ upcoming events in the next 30 days\n`;
      }
      
      context += `\nWhat you can ask me:\n`;
      context += `• "Find computer science clubs at UTSG"\n`;
      context += `• "What events are happening this week?"\n`;
      context += `• "Show me programming opportunities"\n`;
      context += `• "Find clubs at UTM"\n\n`;
    }

    return { context, data };
  }

  // NEW: Comprehensive club search method - ENHANCED FOR GENERAL REQUESTS
  private async performComprehensiveClubSearch(query: string, campus: string | undefined, originalMessage: string): Promise<any[]> {
    let clubs: any[] = [];
    
    // Strategy 1: If query is empty or general request, get clubs directly
    if (!query || query.trim() === '' || originalMessage.includes('other clubs') || originalMessage.includes('some clubs')) {
      console.log('🔍 General club search - getting all clubs');
      clubs = await searchClubs({ query: '', campus, limit: 15 });
      if (clubs && clubs.length > 0) {
        console.log(`✅ Found ${clubs.length} clubs with general search`);
        return clubs;
      }
    }
    
    // Strategy 2: Direct search with extracted query
    if (query && query.trim() !== '') {
      clubs = await searchClubs({ query, campus, limit: 10 });
      if (clubs && clubs.length > 0) {
        console.log(`✅ Found clubs with direct search: "${query}"`);
        return clubs;
      }
    }
    
    // Strategy 3: Try subject-specific searches for CS-related queries
    if (originalMessage.includes('computer') || originalMessage.includes('cs') || originalMessage.includes('programming')) {
      const csQueries = [
        'computer science',
        'computer',
        'cs',
        'programming',
        'software',
        'tech',
        'technology',
        'development',
        'coding',
        'engineering'
      ];
      
      for (const csQuery of csQueries) {
        clubs = await searchClubs({ query: csQuery, campus, limit: 10 });
        if (clubs && clubs.length > 0) {
          console.log(`✅ Found clubs with CS query: "${csQuery}"`);
          break;
        }
      }
    }
    
    // Strategy 4: Try without campus restriction if still no results
    if ((!clubs || clubs.length === 0) && campus) {
      console.log('🔄 Trying search without campus restriction...');
      clubs = await searchClubs({ query: query || '', limit: 15 });
    }
    
    // Strategy 5: Try very broad search if still no results
    if (!clubs || clubs.length === 0) {
      console.log('🔄 Trying broad search...');
      clubs = await searchClubs({ query: '', limit: 20 }); // Get any clubs
      
      // If we have a campus preference, prioritize those clubs
      if (clubs && clubs.length > 0 && campus) {
        const campusClubs = clubs.filter((club: any) => 
          club.campus && club.campus.toLowerCase() === campus.toLowerCase()
        );
        const otherClubs = clubs.filter((club: any) => 
          !club.campus || club.campus.toLowerCase() !== campus.toLowerCase()
        );
        clubs = [...campusClubs, ...otherClubs];
      }
    }
    
    return clubs || [];
  }

  // Enhanced relevance scoring
  private calculateRelevanceScore(club: any, query: string): number {
    let score = 0;
    const queryWords = query.toLowerCase().split(' ');
    const clubName = (club.name || '').toLowerCase();
    const clubDescription = (club.description || '').toLowerCase();
    const clubText = `${clubName} ${clubDescription}`;
    
    // Score based on name matches (highest weight)
    queryWords.forEach(word => {
      if (word.length > 2) {
        if (clubName.includes(word)) score += 15;
        if (clubDescription.includes(word)) score += 8;
      }
    });
    
    // Bonus for exact phrase matches
    if (clubName.includes(query)) score += 25;
    if (clubDescription.includes(query)) score += 20;
    
    // Bonus for CS-specific terms
    const csTerms = ['computer', 'programming', 'software', 'tech', 'cs', 'development', 'engineering'];
    csTerms.forEach(term => {
      if (clubText.includes(term)) score += 10;
    });
    
    // Bonus for subject-specific terms
    const subjectTerms = ['business', 'arts', 'music', 'sports', 'science', 'math'];
    subjectTerms.forEach(term => {
      if (query.includes(term) && clubText.includes(term)) score += 12;
    });
    
    return score;
  }

  private isGreeting(message: string): boolean {
    const greetingKeywords = [
        'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 
        'greetings', 'howdy', 'what\'s up', 'whats up', 'sup'
    ];
    return greetingKeywords.some(keyword => message.includes(keyword)) || message.length < 10;
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

  // Intent detection methods - IMPROVED
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

  // Enhanced club-related detection
  private isClubRelated(message: string): boolean {
    const clubKeywords = [
      'club', 'clubs', 'organization', 'organizations', 'society', 'societies', 
      'group', 'groups', 'student union', 'association', 'team', 'teams',
      'union', 'committee', 'council', 'collective', 'network'
    ];
    
    const subjectKeywords = [
      'computer science', 'cs', 'programming', 'tech', 'technology', 'software',
      'engineering', 'business', 'arts', 'science', 'music', 'sports', 'cultural', 
      'academic', 'math', 'mathematics', 'physics', 'chemistry', 'biology',
      'psychology', 'sociology', 'economics', 'finance', 'marketing', 'design',
      'robotics', 'ai', 'artificial intelligence', 'machine learning', 'data science'
    ];
    
    const searchPhrases = [
      'find clubs', 'search clubs', 'looking for clubs', 'clubs that', 'clubs focused',
      'clubs about', 'clubs related to', 'show me clubs', 'list clubs', 'clubs for',
      'give me clubs', 'computer science clubs', 'programming clubs', 'tech clubs',
      'other clubs', 'some clubs', 'any clubs', 'more clubs'  // Added these general phrases
    ];
    
    return clubKeywords.some(keyword => message.includes(keyword)) ||
           subjectKeywords.some(term => message.includes(term)) ||
           searchPhrases.some(phrase => message.includes(phrase));
  }

  private isEventRelated(message: string): boolean {
    const eventKeywords = [
      'event', 'events', 'happening', 'upcoming', 'activities', 'activity',
      'this week', 'next week', 'today', 'tomorrow', 'weekend', 'soon'
    ];
    const eventPhrases = [
      'events within', 'events in', 'what\'s happening', 'whats happening',
      'upcoming events', 'events this', 'events next', 'events today'
    ];
    
    return eventKeywords.some(keyword => message.includes(keyword)) ||
           eventPhrases.some(phrase => message.includes(phrase));
  }

  private isPostRelated(message: string): boolean {
    const postKeywords = [
      'post', 'posts', 'announcement', 'announcements', 'news', 'update', 
      'updates', 'hiring', 'job', 'opportunity', 'opportunities'
    ];
    return postKeywords.some(keyword => message.includes(keyword));
  }

  private isGeneralInfo(message: string): boolean {
    const generalKeywords = [
      'help', 'campus', 'campuses', 'what', 'how', 'categories', 'options', 
      'about', 'info', 'clubhub', 'getting started', 'start'
    ];
    const generalPhrases = [
      'tell me about', 'what is', 'how do', 'can you help', 'get started'
    ];
    
    return generalKeywords.some(keyword => message.includes(keyword)) ||
           generalPhrases.some(phrase => message.includes(phrase)) ||
           message.length < 15;
  }

  // Enhanced query extraction with better handling of general requests - FIXED
  private extractQuery(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Handle general club requests without specific subjects
    if (lowerMessage.includes('other clubs') || lowerMessage.includes('some clubs') || lowerMessage.includes('any clubs')) {
      return ''; // Return empty string to get all clubs
    }
    
    if (lowerMessage.includes('give me clubs') || lowerMessage.includes('show me clubs') || lowerMessage.includes('find clubs')) {
      // Check if there are specific subject terms after the general request
      const afterRequest = lowerMessage.split(/give me|show me|find/)[1] || '';
      if (afterRequest.includes('computer') || afterRequest.includes('cs')) {
        return 'computer science cs programming software development tech technology coding';
      }
      if (afterRequest.includes('tech')) {
        return 'technology tech computer science programming software engineering';
      }
      // If no specific subject, return empty for general search
      return '';
    }
    
    // Handle specific patterns for better extraction
    if (lowerMessage.includes('computer science') || lowerMessage.includes('cs')) {
      return 'computer science cs programming software development tech technology coding';
    }
    if (lowerMessage.includes('programming') || lowerMessage.includes('coding')) {
      return 'programming coding computer science cs software development';
    }
    if (lowerMessage.includes('tech') || lowerMessage.includes('technology')) {
      return 'technology tech computer science programming software engineering';
    }
    if (lowerMessage.includes('software')) {
      return 'software programming computer science development engineering tech';
    }
    if (lowerMessage.includes('engineering')) {
      return 'engineering technical science computer software';
    }
    if (lowerMessage.includes('data science') || lowerMessage.includes('machine learning') || lowerMessage.includes('ai')) {
      return 'data science machine learning ai artificial intelligence computer science programming';
    }
    if (lowerMessage.includes('business')) {
      return 'business commerce management entrepreneurship finance';
    }
    if (lowerMessage.includes('arts')) {
      return 'arts creative culture visual performing';
    }
    if (lowerMessage.includes('music')) {
      return 'music performance band orchestra choir';
    }
    if (lowerMessage.includes('sports') || lowerMessage.includes('athletic')) {
      return 'sports athletic fitness recreation physical';
    }
    if (lowerMessage.includes('math') || lowerMessage.includes('mathematics')) {
      return 'mathematics math statistics calculus algebra';
    }
    
    // Extract meaningful words with better filtering
    const words = lowerMessage.split(' ');
    const stopWords = [
      'what', 'is', 'are', 'the', 'find', 'search', 'for', 'about', 'show', 'me', 
      'at', 'in', 'on', 'can', 'you', 'i', 'want', 'to', 'looking', 'any', 'some',
      'that', 'clubs', 'focused', 'around', 'within', 'events', 'upcoming', 'give',
      'related', 'help', 'please', 'thanks', 'thank', 'other', 'from', 'utsg', 'utm', 'utsc'
    ];
    
    const meaningfulWords = words.filter(word => 
      !stopWords.includes(word) && 
      word.length > 2 && 
      !word.match(/^\d+$/)
    );
    
    // If no meaningful words found, return empty string for general search
    if (meaningfulWords.length === 0) {
      return '';
    }
    
    return meaningfulWords.join(' ');
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
    // Look for specific time phrases
    if (message.includes('within the week') || message.includes('this week')) return 7;
    if (message.includes('within a week')) return 7;
    if (message.includes('next week')) return 14;
    if (message.includes('within 2 weeks') || message.includes('within two weeks')) return 14;
    if (message.includes('this month') || message.includes('within a month')) return 30;
    
    // Look for specific number patterns
    const match = message.match(/(\d+)\s*days?/);
    if (match) return parseInt(match[1]);
    
    const weekMatch = message.match(/(\d+)\s*weeks?/);
    if (weekMatch) return parseInt(weekMatch[1]) * 7;
    
    // Default cases
    if (message.includes('today') || message.includes('tonight')) return 1;
    if (message.includes('tomorrow')) return 2;
    if (message.includes('weekend')) return 3;
    if (message.includes('soon')) return 7;
    
    return 7; // Default to 7 days
  }
}