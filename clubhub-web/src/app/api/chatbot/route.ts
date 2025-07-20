import { NextRequest, NextResponse } from 'next/server';
import { VertexChatbotService } from '@/lib/chatbot/vertexService';

const chatbotService = new VertexChatbotService();

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Basic validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Process with your RAG service
    const result = await chatbotService.processMessage(message.trim());

    // Return response
    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: "Sorry, I'm having trouble. Please try again! 🤖"
      },
      { status: 500 }
    );
  }
}