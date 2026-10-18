import { NextRequest, NextResponse } from 'next/server';
import { ChatbotService } from '@/lib/chatbot/chatbotService';

const chatbotService = new ChatbotService();

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Basic validation
    if (typeof message !== 'string' || message.trim().length < 1 || message.trim().length > 1000) {
      return NextResponse.json(
        { error: 'Message is required and must be at most 1000 characters' },
        { status: 400 }
      );
    }

    // Process with your RAG service (pass request for authentication)
    const result = await chatbotService.processMessage(message.trim(), request);

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error: any) {
    console.error('Chatbot error:', error);

    // Handle authentication errors specifically
    if (error.message?.includes('must be signed in')) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: "Please sign in to use the chatbot feature."
        },
        { status: 401 }
      );
    }

    // Handle authorization errors (cost concerns)
    if (error.message?.includes('cost concerns')) {
      return NextResponse.json(
        {
          error: 'Authorization required',
          message: error.message
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: "Sorry, I'm having trouble. Please try again!"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({ 
      status: 'Chatbot API is running!',
      timestamp: new Date().toISOString(),
      configured: !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL)
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Chatbot API has issues',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}