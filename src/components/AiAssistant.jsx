import { useState } from 'react';
import { askAi } from '../services/ai.js';
import { ANALYTICS_EVENTS, trackEvent as trackGAEvent } from '../utils/analytics.js';

const quickPrompts = ['Đi tiệc cưới mặc gì?', 'Tư vấn áo dài', 'Chọn size giúp tôi', 'Quy trình thuê đồ'];

const formatAiText = (text) => text
  .replace(/^\[[^\]]+\]\s*/, '')
  .replace(/\*\*/g, '')
  .replace(/\s*\*\s+/g, '\n• ')
  .replace(/(\d+\.\s+)/g, '\n$1')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const AiMessage = ({ text }) => {
  const lines = formatAiText(text);
  return (
    <div className="ai-text-block">
      {lines.map((line, index) => {
        if (line.startsWith('• ')) return <p className="ai-list-line" key={index}>{line}</p>;
        if (/^\d+\.\s/.test(line)) return <p className="ai-step-line" key={index}>{line}</p>;
        return <p key={index}>{line}</p>;
      })}
    </div>
  );
};

const AiAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Xin chào, tôi là AI BuildLab. Bạn cần tư vấn trang phục, size hay quy trình thuê?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async (text) => {
    if (!text.trim() || loading) return;
    trackGAEvent(ANALYTICS_EVENTS.CLICK_CHAT, {
      source: 'ai_assistant',
      message_length: text.trim().length,
      prompt_type: quickPrompts.includes(text) ? 'quick_prompt' : 'custom',
    });
    setMessages((items) => [...items, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const result = await askAi(text);
      const prefix = result.provider && result.provider !== 'none' ? `[${result.provider}] ` : '';
      setMessages((items) => [...items, { role: 'assistant', text: `${prefix}${result.answer}` }]);
    } catch (error) {
      setMessages((items) => [...items, { role: 'assistant', text: error?.response?.data?.message || 'AI chưa phản hồi được. Kiểm tra GEMINI_API_KEY hoặc GROQ_API_KEY trong .env.' }]);
    } finally {
      setLoading(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    ask(input);
  };

  return (
    <div className={`ai-widget ${open ? 'open' : ''}`}>
      {open && (
        <section className="ai-panel" aria-label="Tư vấn thuê trang phục AI">
          <div className="ai-header">
            <div>
              <strong>Tư vấn thuê trang phục AI</strong>
              <span>Hỏi BuildLab về outfit, size, thuê trả</span>
            </div>
            <button type="button" onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="ai-messages">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`ai-message-row ${message.role}`}>
                <div className="ai-bubble">{message.role === 'assistant' ? <AiMessage text={message.text} /> : message.text}</div>
              </div>
            ))}
            {loading && <div className="ai-message-row assistant"><div className="ai-bubble">Đang tư vấn...</div></div>}
          </div>
          <div className="quick-prompts">
            {quickPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => ask(prompt)}>{prompt}</button>)}
          </div>
          <form onSubmit={submit} className="ai-composer">
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Nhập yêu cầu của bạn..." />
            <button type="submit" disabled={loading}>Gửi</button>
          </form>
        </section>
      )}
      <button className="ai-toggle" type="button" onClick={() => setOpen((value) => !value)}>
        {open ? 'Đóng AI' : 'AI tư vấn'}
      </button>
    </div>
  );
};

export default AiAssistant;
