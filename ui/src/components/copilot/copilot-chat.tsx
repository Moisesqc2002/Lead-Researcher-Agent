'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Campaign, copilotApi, CopilotMessage } from '@/lib/api';
import { Bot, Send, X, User, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CopilotChatProps {
  campaign: Campaign;
}

export function CopilotChat({ campaign }: CopilotChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hi! I'm your Lead Research Copilot. I can help you define your Ideal Customer Profile (ICP) for "${campaign.name}" and start researching qualified leads. What type of leads are you looking for?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Convert to the format expected by the API
      const conversationHistory: CopilotMessage[] = messages.map(msg => ({
        type: msg.type,
        content: msg.content
      }));

      const response = await copilotApi.sendMessage(
        campaign.id,
        userMessage.content,
        conversationHistory
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show ICP extraction notification if detected
      if (response.icpExtracted) {
        console.log('ICP details extracted:', response.icpDetails);
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setError('Failed to get response from AI. Please try again.');
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartResearch = async () => {
    try {
      setIsLoading(true);
      await copilotApi.startResearch(campaign.id);
      
      const researchMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `🚀 **Research Started!**

I'm now researching leads that match your criteria. This process typically takes 5-10 minutes.

**What I'm doing:**
✓ Searching LinkedIn for matching profiles
✓ Finding verified email addresses  
✓ Gathering company information
✓ Scoring lead quality and interest

You'll be notified when the research is complete. You can continue working in other tabs while I work in the background.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, researchMessage]);
      
      // Refresh the page after a short delay to update campaign status
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Failed to start research:', error);
      setError('Failed to start research. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Copilot</h3>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.type === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.content}
              </div>
              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded mb-3">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        
        {campaign.status === 'DRAFT' && (
          <div className="mb-3">
            <Button
              onClick={handleStartResearch}
              disabled={isLoading}
              className="w-full mb-2"
              variant="default"
            >
              🚀 Start Lead Research
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Ready to begin? Click above to start researching leads based on our conversation
            </p>
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your ideal customer profile..."
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Describe your target audience and I'll help research qualified leads
        </p>
      </div>
    </div>
  );
}