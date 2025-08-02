import { NextRequest, NextResponse } from 'next/server';
import { VertexChatbotService } from '@/lib/chatbot/vertexService';

const chatbotService = new VertexChatbotService();

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    console.log('=== CHATBOT DEBUG START ===');
    console.log('1. Received message:', message);

    // Basic validation
    if (!message || typeof message !== 'string') {
      console.log('2. Validation failed');
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    console.log('2. Validation passed');
    console.log('3. About to call processMessage...');

    // Process with your RAG service
    const result = await chatbotService.processMessage(message.trim());
    
    console.log('4. processMessage completed successfully');
    console.log('5. Result:', {
      hasMessage: !!result.message,
      fullMessage: result.message,
      hasData: !!result.data
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error: any) {
    console.log('=== ERROR CAUGHT ===');
    console.log('Error type:', error.constructor?.name || 'Unknown');
    console.log('Error message:', error.message || 'No message');
    console.log('Error stack:', error.stack || 'No stack');
    
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
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: "Sorry, I'm having trouble. Please try again!",
        debug: error.message || 'Unknown error'
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
      serviceInitialized: true
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Chatbot API has issues',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}