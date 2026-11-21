import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  HelpCircle, 
  ArrowRight,
  Info,
  Clock,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { AI_SUGGESTED_QUESTIONS, AI_KNOWLEDGE_BASE, getAqiCategory } from '../data/mockData';

export default function AiAssistant({ 
  currentCity, 
  userProfile, 
  initialQuestion 
}) {
  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      time: 'Just now',
      title: 'Welcome to BreatheWise AI',
      text: `Hello ${userProfile.name || 'there'}! I am your BreatheWise air-quality and daily routine companion.

I help you navigate urban smog by adapting your schedules, recommending safe exercise windows, optimizing indoor ventilation, and cutting personal emissions.

Currently for **${currentCity.name}**, air quality is **${getAqiCategory(currentCity.aqi).category}** (AQI ${currentCity.aqi}).

*Demo Knowledge Mode active • Google Gemini Generative AI integration prepared for Stage 2.*`
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle incoming initialQuestion from Dashboard shortcut
  useEffect(() => {
    if (initialQuestion) {
      handleSend(initialQuestion);
    }
  }, [initialQuestion]);

  const findBestResponse = (query) => {
    const raw = query.trim();
    const clean = raw.toLowerCase().replace(/[?!.,;:']/g, '');

    // 1. Natural Greeting Intent (Hi, Hello, Hey, Good morning, etc.)
    const isGreeting = /^(hi|hello|hey|heyy|heya|howdy|good morning|good afternoon|good evening|greetings|sup|yo)$/i.test(clean) ||
      clean.startsWith('hi ') || clean.startsWith('hello ') || clean.startsWith('hey ') ||
      clean === 'hi breathewise' || clean === 'hello breathewise';

    if (isGreeting) {
      const resp = AI_KNOWLEDGE_BASE.greeting.response(userProfile.name, currentCity, currentCity.aqi);
      return {
        title: AI_KNOWLEDGE_BASE.greeting.title,
        response: resp
      };
    }

    // 2. Gratitude Intent (Thanks, Thank you, Appreciate it, etc.)
    const isGratitude = /^(thanks|thank you|thx|thank you so much|thanks a lot|appreciate it|thank u|ty)$/i.test(clean) ||
      clean.includes('thank you') || clean.includes('thanks');

    if (isGratitude) {
      const resp = AI_KNOWLEDGE_BASE.gratitude.response(userProfile.name);
      return {
        title: AI_KNOWLEDGE_BASE.gratitude.title,
        response: resp
      };
    }

    // 3. Goodbye / Sign-off Intent (Bye, Goodbye, See you, Take care, etc.)
    const isGoodbye = /^(bye|goodbye|cya|see you|take care|good night|have a good day|have a nice day)$/i.test(clean) ||
      clean.includes('goodbye') || clean.includes('bye bye') || clean.startsWith('bye ');

    if (isGoodbye) {
      const resp = AI_KNOWLEDGE_BASE.goodbye.response(userProfile.name);
      return {
        title: AI_KNOWLEDGE_BASE.goodbye.title,
        response: resp
      };
    }

    // 4. Identity & Capabilities Intent
    if (clean.includes('who are you') || clean.includes('what can you do') || clean.includes('what do you do') || clean === 'help') {
      const resp = AI_KNOWLEDGE_BASE.identity.response();
      return {
        title: AI_KNOWLEDGE_BASE.identity.title,
        response: resp
      };
    }

    // 5. Suggested Prompt: Exercise Safety ("Is it safe to exercise outdoors today?", workouts, running, cycling, gym)
    // Checked BEFORE daily planning to avoid "today" causing cross-matching!
    if (clean.includes('exercise') || clean.includes('workout') || clean.includes('run') || clean.includes('jog') || clean.includes('gym') || clean.includes('cycling') || clean.includes('sports outdoors') || clean.includes('safe to run')) {
      const resp = AI_KNOWLEDGE_BASE.exercise_safety.response(userProfile.name, currentCity, currentCity.aqi);
      return {
        title: AI_KNOWLEDGE_BASE.exercise_safety.title,
        response: resp
      };
    }

    // 6. Suggested Prompt: Indoor Air Quality ("How can I improve indoor air quality?", purifiers, filters, room air)
    if (clean.includes('indoor') || clean.includes('purifier') || clean.includes('air at home') || clean.includes('clean air inside') || clean.includes('clean indoor air')) {
      const resp = AI_KNOWLEDGE_BASE.indoor_air_improvement.response();
      return {
        title: AI_KNOWLEDGE_BASE.indoor_air_improvement.title,
        response: resp
      };
    }

    // 7. Suggested Prompt: Commute Precautions ("What precautions should I take during my commute?", traffic, cars, metro)
    if (clean.includes('commute') || clean.includes('traffic') || clean.includes('travel') || clean.includes('metro') || clean.includes('carpool') || clean.includes('transit') || clean.includes('on the road')) {
      const resp = AI_KNOWLEDGE_BASE.commute_precautions.response();
      return {
        title: AI_KNOWLEDGE_BASE.commute_precautions.title,
        response: resp
      };
    }

    // 8. Suggested Prompt: Reduce Contribution / Sustainable Lifestyle ("How can I reduce my contribution to air pollution?")
    if (clean.includes('reduce') || clean.includes('contribution') || clean.includes('my footprint') || clean.includes('sustainable') || clean.includes('cut emissions') || clean.includes('how can i help')) {
      const resp = AI_KNOWLEDGE_BASE.reduce_contribution.response();
      return {
        title: AI_KNOWLEDGE_BASE.reduce_contribution.title,
        response: resp
      };
    }

    // 9. Specific Domain Topic: Houseplants vs Purifiers (Checked before daily plan to prevent "plant" matching "plan")
    if (clean.includes('plant') || clean.includes('houseplant') || clean.includes('snake plant') || clean.includes('spider plant') || clean.includes('flora')) {
      const resp = AI_KNOWLEDGE_BASE.houseplants.response();
      return {
        title: AI_KNOWLEDGE_BASE.houseplants.title,
        response: resp
      };
    }

    // 10. Specific Domain Topic: Mask Guide (N95 vs surgical/cloth)
    if (clean.includes('mask') || clean.includes('n95') || clean.includes('ffp2') || clean.includes('cloth mask') || clean.includes('respirator')) {
      const resp = AI_KNOWLEDGE_BASE.mask_guide.response();
      return {
        title: AI_KNOWLEDGE_BASE.mask_guide.title,
        response: resp
      };
    }

    // 11. Specific Domain Topic: Inversion Science
    if (clean.includes('inversion') || clean.includes('why is smog') || clean.includes('why winter') || clean.includes('causes of pollution') || clean.includes('why bad air')) {
      const resp = AI_KNOWLEDGE_BASE.inversion_science.response();
      return {
        title: AI_KNOWLEDGE_BASE.inversion_science.title,
        response: resp
      };
    }

    // 12. Specific Domain Topic: Vulnerable Demographics (Asthma, kids, seniors)
    if (clean.includes('asthma') || clean.includes('child') || clean.includes('kids') || clean.includes('senior') || clean.includes('elderly') || clean.includes('baby')) {
      const resp = AI_KNOWLEDGE_BASE.vulnerable_groups.response();
      return {
        title: AI_KNOWLEDGE_BASE.vulnerable_groups.title,
        response: resp
      };
    }

    // 13. Suggested Prompt: Plan Day High AQI ("How should I plan my day when AQI is high?", daily routine, schedule)
    if (clean.includes('plan my day') || /\bplan\b|\bplans\b|\bplanning\b/.test(clean) || clean.includes('routine') || clean.includes('schedule') || (clean.includes('day') && (clean.includes('smog') || clean.includes('aqi') || clean.includes('high')))) {
      const resp = AI_KNOWLEDGE_BASE.plan_day_high_aqi.response(userProfile.name, currentCity, currentCity.aqi);
      return {
        title: AI_KNOWLEDGE_BASE.plan_day_high_aqi.title,
        response: resp
      };
    }

    // 14. Intelligent Fallback for Unmatched Questions (Addresses question contextually without cookie-cutter repetition)
    const cat = getAqiCategory(currentCity.aqi);
    return {
      title: `Guidance on "${raw.length > 35 ? raw.substring(0, 32) + '...' : raw}"`,
      response: `Thank you for asking about **"${raw}"**.

Here is our targeted advice based on current conditions in **${currentCity.name}** (AQI: **${currentCity.aqi}** — *${cat.category}*):

1. **Environmental Context:** At AQI ${currentCity.aqi}, ambient PM2.5 levels are ${currentCity.aqi > 100 ? 'significantly elevated above safe thresholds' : 'within manageable limits'}. Airway protection should be prioritized during early morning and late evening hours.
2. **Actionable Direction:** If this activity involves outdoor exposure, consider timing it between **1:00 PM and 3:00 PM** when solar warming helps disperse ground-level smog layers.
3. **Personalization Notice:** Your profile sensitivity (${userProfile.healthSensitivity !== 'none' ? userProfile.healthSensitivity.replace('_', ' ') : 'standard'}) has been accounted for in the daily routine timeline.

*(Demo Mode Note: In Stage 2, this specific query will be processed directly by Google Gemini 1.5/2.0 with live generative reasoning and multi-turn dialogue).*`
    };
  };

  const handleSend = (textToSend) => {
    const text = textToSend || inputVal.trim();
    if (!text) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      time: 'Just now',
      text: text
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Simulate realistic AI thought / response delay
    setTimeout(() => {
      const match = findBestResponse(text);
      const assistantMsg = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        time: 'Just now',
        title: match.title,
        text: match.response
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'msg-welcome-reset',
        sender: 'assistant',
        time: 'Just now',
        title: 'Welcome to BreatheWise AI',
        text: `Chat reset. Ask me anything about urban smog management, outdoor sports safety, indoor air filters, or your daily schedule!`
      }
    ]);
  };

  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 180px)',
      minHeight: '560px',
      maxHeight: '800px',
      backgroundColor: '#FFFFFF',
      borderRadius: '24px',
      border: '1px solid #C5DDD7',
      boxShadow: '0 8px 30px rgba(16, 46, 53, 0.08)',
      overflow: 'hidden'
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #E2ECE9',
        backgroundColor: '#102E35',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: '#20464A',
            border: '1px solid #8DE0C3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(141, 224, 195, 0.3)'
          }}>
            <Sparkles size={20} color="#8DE0C3" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF' }}>
                BreatheWise AI Companion
              </span>
              <span style={{
                fontSize: '0.65rem',
                backgroundColor: 'rgba(141, 224, 195, 0.2)',
                color: '#8DE0C3',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontWeight: 700,
                border: '1px solid rgba(141, 224, 195, 0.4)'
              }}>
                Demo Knowledge Mode
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#C5DDD7' }}>
              Context: {currentCity.name} (AQI {currentCity.aqi}) • {userProfile.name}'s Profile
            </div>
          </div>
        </div>

        <button
          onClick={resetChat}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#E2ECE9',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
          title="Reset conversation"
        >
          <RotateCcw size={13} />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Suggested Questions Quick Shelf */}
      <div style={{
        padding: '10px 16px',
        backgroundColor: '#F3F8F6',
        borderBottom: '1px solid #E2ECE9',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        <span style={{
          fontSize: '0.725rem',
          fontWeight: 700,
          color: '#20464A',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexShrink: 0
        }}>
          <HelpCircle size={13} /> Suggested:
        </span>
        {AI_SUGGESTED_QUESTIONS.map((question, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(question)}
            style={{
              padding: '5px 12px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #C5DDD7',
              fontSize: '0.775rem',
              color: '#102E35',
              fontWeight: 500,
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.target.style.borderColor = '#8DE0C3'}
            onMouseLeave={(e) => e.target.style.borderColor = '#C5DDD7'}
          >
            {question}
          </button>
        ))}
      </div>

      {/* Message Feed Area */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: '#FAFCFB'
      }}>
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: isUser ? '85%' : '90%',
                flexDirection: isUser ? 'row-reverse' : 'row'
              }}
            >
              {/* Avatar Icon */}
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: isUser ? '#102E35' : '#EBF8F4',
                color: isUser ? '#8DE0C3' : '#102E35',
                border: isUser ? 'none' : '1px solid rgba(141, 224, 195, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                {isUser ? <User size={16} /> : <Bot size={18} />}
              </div>

              {/* Message Bubble */}
              <div style={{
                backgroundColor: isUser ? '#102E35' : '#FFFFFF',
                color: isUser ? '#FFFFFF' : '#102E35',
                padding: '14px 18px',
                borderRadius: '18px',
                borderTopRightRadius: isUser ? '4px' : '18px',
                borderTopLeftRadius: !isUser ? '4px' : '18px',
                border: isUser ? 'none' : '1px solid #E2ECE9',
                boxShadow: isUser ? '0 2px 8px rgba(16, 46, 53, 0.15)' : 'var(--shadow-sm)',
                fontSize: '0.885rem',
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap'
              }}>
                {msg.title && (
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: isUser ? '#8DE0C3' : '#20464A',
                    marginBottom: '6px'
                  }}>
                    {msg.title}
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              backgroundColor: '#EBF8F4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #8DE0C3'
            }}>
              <Bot size={18} color="#102E35" />
            </div>
            <div style={{
              padding: '12px 18px',
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              borderTopLeftRadius: '4px',
              border: '1px solid #E2ECE9',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '0.825rem', color: '#6B878D' }}>BreatheWise is formulating response...</span>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#8DE0C3',
                animation: 'pulseGlow 1s infinite'
              }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <form onSubmit={handleSubmit} style={{
        padding: '14px 18px',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E2ECE9',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Say Hi, or ask about workouts, masks, schedules, or air purifiers..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '14px',
              border: '1px solid #C5DDD7',
              backgroundColor: '#F3F8F6',
              fontSize: '0.9rem',
              color: '#102E35',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isTyping}
            className="btn btn-primary"
            style={{
              padding: '0 20px',
              borderRadius: '14px',
              opacity: !inputVal.trim() || isTyping ? 0.6 : 1,
              cursor: !inputVal.trim() || isTyping ? 'default' : 'pointer'
            }}
          >
            <Send size={18} color="#8DE0C3" />
            <span>Send</span>
          </button>
        </div>

        {/* Prototype architecture footnote */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.725rem',
          color: '#6B878D'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Info size={12} color="#7E989C" />
            Demo responses clearly labelled. Generative Gemini service hook ready for Stage 2.
          </span>
          <span>Press Enter to send</span>
        </div>
      </form>
    </div>
  );
}
