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
  RotateCcw,
  Code,
  ChevronDown,
  ChevronUp,
  Lock,
  AlertCircle,
  RefreshCw,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { AI_SUGGESTED_QUESTIONS } from '../data/mockData';
import { sendChatMessage, checkAiServiceStatus } from '../services/aiApiClient';

export default function AiAssistant({ 
  currentCity, 
  userProfile, 
  engineOutput,
  initialQuestion 
}) {
  const [showPayloadInspection, setShowPayloadInspection] = useState(false);
  const [aiServiceStatus, setAiServiceStatus] = useState({ configured: false, model: null, status: 'checking' });
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastError, setLastError] = useState(null);
  const messagesEndRef = useRef(null);
  const isSendingRef = useRef(false);

  const aqiRes = engineOutput?.aqiResult || currentCity.aqiResult;
  const hasValidAqi = Boolean(aqiRes?.valid && aqiRes?.aqi !== null);
  const aqiText = hasValidAqi 
    ? `**${aqiRes.category}** (AQI ${aqiRes.aqi})` 
    : `**Sensor Telemetry Offline** (Precautionary Baseline Active)`;

  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      time: 'Just now',
      title: 'Welcome to BreatheWise AI',
      text: `Hello ${userProfile.name || 'there'}! I am your BreatheWise personal air-quality companion powered by Google Gemini.

I help you navigate urban smog by adapting daily schedules, recommending safe exercise windows, optimizing indoor ventilation, explaining decision-engine guidance, and answering commuting or sustainability questions.

Currently for **${currentCity.liveStation || currentCity.name}**, air quality is ${aqiText}.

*Safety note: BreatheWise CPCB rule-based safety constraints are authoritative. Guidance is grounded in physical atmospheric science.*`,
      source: 'system'
    }
  ]);

  // Check backend Gemini status on mount
  useEffect(() => {
    let isMounted = true;
    checkAiServiceStatus().then(status => {
      if (isMounted) {
        setAiServiceStatus(status);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle incoming initialQuestion (e.g. from Dashboard or Daily Routine shortcut)
  useEffect(() => {
    if (initialQuestion) {
      handleSend(initialQuestion);
    }
  }, [initialQuestion]);

  // Used ONLY when the backend cannot be reached at all. The server handles
  // greetings, thanks, current AQI and basic-mode answers itself.
  const getOfflineMessage = () => ({
    title: 'Assistant unreachable',
    message: "I can't reach the assistant service right now. Please check the dashboard for the latest AQI reading and try again in a moment."
  });

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isSendingRef.current) return;
isSendingRef.current = true;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: text
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);
    setLastError(null);

    // Prepare structured context
    const aqiContext = {
      city: currentCity.name || null,
      aqi: hasValidAqi ? aqiRes.aqi : null,
      category: hasValidAqi ? aqiRes.category : null,
      primaryPollutant: currentCity.primaryPollutant || null,
      pm25: currentCity.pm25 ?? null,
      pm10: currentCity.pm10 ?? null,
      weather: currentCity.weatherProvider ? { provider: currentCity.weatherProvider, temperature: currentCity.temp, humidity: currentCity.humidity, windSpeed: currentCity.windSpeed, visibility: currentCity.visibility, boundaryLayerHeight: currentCity.boundaryLayerHeight } : null,
      dataSource: currentCity.dataSource || null,
      station: currentCity.liveStation || currentCity.name,
      lastUpdated: currentCity.lastUpdated || aqiRes?.lastUpdatedText,
      isStale: Boolean(aqiRes?.isStale),
      isLiveData: Boolean(currentCity.isLiveData),
      // TODO(confirm): use the property the app really uses to mark demo data
      isDemo: Boolean(currentCity.isDemo || currentCity.isDemoData || /demo/i.test(String(currentCity.dataSource || ''))),
      isValidAqi: hasValidAqi
    };

    // History for contextual follow-up (convert previous turns)
    const historyPayload = messages
      .filter(m => m.source !== 'system')
      .slice(-6)
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        text: m.text || m.data?.message || ''
      }));

    try {
      const response = await sendChatMessage({
        message: text,
        conversationHistory: historyPayload,
        aqiContext,
        userProfile,
        engineRecommendations: engineOutput?.recommendations || []
      });

      if (response.status === 'success' && response.data) {
        // source from server: 'gemini' | 'instant' (greetings, current AQI) | 'basic' (AI unavailable)
        const uiSource = response.source === 'basic' ? 'rule_fallback' : (response.source === 'instant' ? 'instant' : 'gemini');
        const assistantMsg = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: response.data.message,
          data: response.data,
          source: uiSource,
          model: response.model,
          fallbackReason: response.source === 'basic' ? (response.fallbackReason || 'The AI service is unavailable.') : undefined
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        // Backend reachable but returned an error payload
        const fallback = getOfflineMessage();
        const fallbackMsg = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          title: fallback.title,
          text: fallback.message,
          source: 'rule_fallback',
          fallbackReason: response.message || 'The AI service is unavailable.'
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }
    } catch (err) {
      console.error('[Assistant Route Error]', err);
      setLastError('Network error contacting the assistant backend.');
      const fallback = getOfflineMessage();
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          title: fallback.title,
          text: fallback.message,
          source: 'rule_fallback',
          fallbackReason: 'Connection to backend failed.'
        }
      ]);
    } finally {
      isSendingRef.current = false;
  setIsTyping(false);
    }
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
        text: `Conversation reset. Ask me anything about urban smog management, outdoor sports safety, indoor air filters, or personalizing your schedule!`,
        source: 'system'
      }
    ]);
    setLastError(null);
  };

  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 180px)',
      minHeight: '580px',
      maxHeight: '820px',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF' }}>
                BreatheWise AI Companion
              </span>
              {aiServiceStatus.configured ? (
                <span style={{
                  fontSize: '0.65rem',
                  backgroundColor: '#065F46',
                  color: '#A7F3D0',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  border: '1px solid #059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  ● Gemini AI Live ({aiServiceStatus.model || 'Flash'})
                </span>
              ) : (
                <span style={{
                  fontSize: '0.65rem',
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  color: '#FDE68A',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  border: '1px solid #D97706',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  ● Basic mode (AI not configured)
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#C5DDD7', marginTop: '2px' }}>
              Context: <strong>{currentCity.liveStation || currentCity.name}</strong> • AQI: {hasValidAqi ? `${aqiRes.aqi} (${aqiRes.category})` : 'Offline (Baseline active)'} • {userProfile.name}'s Profile
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

      {/* Suggested Questions Quick Shelf (Section 9 Prompt Requirements) */}
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
            disabled={isTyping}
            style={{
              padding: '5px 12px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #C5DDD7',
              fontSize: '0.775rem',
              color: '#102E35',
              fontWeight: 500,
              flexShrink: 0,
              cursor: isTyping ? 'default' : 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { if (!isTyping) e.target.style.borderColor = '#8DE0C3'; }}
            onMouseLeave={(e) => { if (!isTyping) e.target.style.borderColor = '#C5DDD7'; }}
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
          const isGemini = msg.source === 'gemini';
          const isFallback = msg.source === 'rule_fallback';

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
                backgroundColor: isUser ? '#102E35' : (isGemini ? '#ECFDF5' : '#EBF8F4'),
                color: isUser ? '#8DE0C3' : (isGemini ? '#065F46' : '#102E35'),
                border: isUser ? 'none' : (isGemini ? '1px solid #A7F3D0' : '1px solid rgba(141, 224, 195, 0.6)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                {isUser ? <User size={16} /> : (isGemini ? <Sparkles size={18} color="#059669" /> : <Bot size={18} />)}
              </div>

              {/* Message Bubble */}
              <div style={{
                backgroundColor: isUser ? '#102E35' : '#FFFFFF',
                color: isUser ? '#FFFFFF' : '#102E35',
                padding: '16px 18px',
                borderRadius: '18px',
                borderTopRightRadius: isUser ? '4px' : '18px',
                borderTopLeftRadius: !isUser ? '4px' : '18px',
                border: isUser ? 'none' : '1px solid #E2ECE9',
                boxShadow: isUser ? '0 2px 8px rgba(16, 46, 53, 0.15)' : 'var(--shadow-sm)',
                fontSize: '0.885rem',
                lineHeight: 1.55
              }}>
                {/* Fallback Notice Banner */}
                {isFallback && (
                  <div style={{
                    marginBottom: '10px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    color: '#92400E',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertCircle size={14} color="#D97706" style={{ flexShrink: 0 }} />
                    <span><strong>Basic mode (AI unavailable):</strong> {msg.fallbackReason}</span>
                  </div>
                )}

                {/* Gemini Live Badge */}
                {isGemini && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    color: '#065F46',
                    backgroundColor: '#ECFDF5',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    marginBottom: '8px'
                  }}>
                    <Sparkles size={11} color="#059669" />
                    <span>Gemini AI{msg.model ? ` (${msg.model})` : ''}</span>
                  </div>
                )}

                {msg.title && (
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.925rem',
                    color: isUser ? '#8DE0C3' : '#20464A',
                    marginBottom: '6px'
                  }}>
                    {msg.title}
                  </div>
                )}

                {/* Main natural-language message */}
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </div>

                {/* Structured Details (When provided by Gemini) */}
                {msg.data && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Actionable Recommendations */}
                    {Array.isArray(msg.data.recommendations) && msg.data.recommendations.length > 0 && (
                      <div style={{
                        padding: '10px 12px',
                        backgroundColor: '#F3F8F6',
                        borderRadius: '10px',
                        border: '1px solid #E2ECE9'
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#102E35', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} color="#059669" />
                          <span>Key Recommendations:</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#20464A' }}>
                          {msg.data.recommendations.map((rec, rIdx) => (
                            <li key={rIdx} style={{ marginBottom: '2px' }}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Scientific / Practical Reasoning */}
                    {msg.data.reasoning && (
                      <div style={{
                        fontSize: '0.775rem',
                        color: '#6B878D',
                        backgroundColor: '#FFFFFF',
                        border: '1px dashed #C5DDD7',
                        padding: '8px 10px',
                        borderRadius: '8px'
                      }}>
                        <strong style={{ color: '#20464A' }}>Reasoning:</strong> {msg.data.reasoning}
                      </div>
                    )}

                    {/* Alternatives */}
                    {Array.isArray(msg.data.alternatives) && msg.data.alternatives.length > 0 && (
                      <div style={{ fontSize: '0.775rem', color: '#065F46' }}>
                        <strong>Permitted Alternatives:</strong> {msg.data.alternatives.join(' • ')}
                      </div>
                    )}

                    {/* Limitations / Caveats */}
                    {msg.data.limitations && (
                      <div style={{
                        fontSize: '0.725rem',
                        color: '#7E989C',
                        fontStyle: 'italic',
                        marginTop: '2px'
                      }}>
                        * {msg.data.limitations}
                      </div>
                    )}
                  </div>
                )}
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
              backgroundColor: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #A7F3D0'
            }}>
              <Sparkles size={18} color="#059669" />
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
              <span style={{ fontSize: '0.825rem', color: '#6B878D' }}>Gemini is reasoning through your air-quality context...</span>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#059669',
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
        {lastError && (
          <div style={{
            fontSize: '0.75rem',
            color: '#B45309',
            backgroundColor: '#FEF3C7',
            padding: '4px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{lastError}</span>
            <button
              type="button"
              onClick={() => handleSend(messages[messages.length - 1]?.text)}
              style={{ background: 'none', border: 'none', color: '#92400E', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask about your workout, commute, air purifiers, or daily schedule..."
            aria-label="Ask BreatheWise Assistant a question"
            disabled={isTyping}
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
            aria-label="Send message"
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

        {/* Prototype architecture footnote & Gemini Stage 3 Context Inspection Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.725rem',
          color: '#6B878D',
          flexWrap: 'wrap',
          gap: '6px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Info size={12} color="#7E989C" />
            BreatheWise CPCB Decision Engine safety rules are authoritative. Real-time context injected.
          </span>
          {engineOutput?.geminiContext && (
            <button
              type="button"
              onClick={() => setShowPayloadInspection(!showPayloadInspection)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: '#20464A',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '2px 4px'
              }}
            >
              <Code size={12} color="#20464A" />
              <span>{showPayloadInspection ? 'Hide' : 'Inspect'} Grounding Context Payload</span>
              {showPayloadInspection ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        {/* Collapsible Decision Engine Context Inspector */}
        {showPayloadInspection && engineOutput?.geminiContext && (
          <div style={{
            marginTop: '8px',
            padding: '12px 14px',
            borderRadius: '12px',
            backgroundColor: '#102E35',
            color: '#8DE0C3',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            maxHeight: '220px',
            overflowY: 'auto',
            border: '1px solid #20464A'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', color: '#FFFFFF', fontWeight: 700 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={12} color="#8DE0C3" />
                Live Context Payload Sent to Gemini AI
              </span>
              <span style={{ fontSize: '0.675rem', color: '#8DE0C3' }}>Sanitized & Bounded</span>
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify({
                userContext: {
                  name: userProfile.name,
                  lifestyle: userProfile.lifestyle,
                  hasPurifier: userProfile.hasAirPurifier,
                  commute: userProfile.commuteType
                },
                airQualityContext: {
                  station: currentCity.liveStation || currentCity.name,
                  aqi: hasValidAqi ? aqiRes.aqi : null,
                  category: hasValidAqi ? aqiRes.category : 'Offline',
                  pm25: currentCity.pm25,
                  pm10: currentCity.pm10,
                  isLive: currentCity.isLiveData
                },
                decisionEngineRules: engineOutput.geminiContext
              }, null, 2)}
            </pre>
          </div>
        )}
      </form>
    </div>
  );
}
