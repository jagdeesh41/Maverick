import { useEffect, useRef, useState } from 'react';
import { askAssistant } from '../api.js';

const CUSTOMER_STARTERS = [
  'How do I issue a new digital asset?',
  'How does Transfer / DvP work?',
  'How does Inheritance work?',
  'How do I claim a property left to me?',
];

const RM_STARTERS = [
  'What is the Issuance Queue?',
  'What are Transfer Confirmations?',
  'What does the Audit Trail cover?',
  'How do KYC Approvals work?',
];

/**
 * Floating "Bank Chain Assistant" chat widget - a Gemini-backed virtual
 * RM that answers questions about the Digital Asset Fabric solution.
 * The backend (POST /assistant/chat) proxies to Gemini and grounds it in
 * a Bank Chain-only system prompt, so no API key or model call happens
 * in the browser.
 */
export default function FaqChatbot({ role }) {
  const isCustomer = role === 'CUSTOMER';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Hi, I'm the Bank Chain Assistant. Ask me anything about tokenizing, transferring, or managing your digital assets on this platform.",
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bodyRef = useRef(null);
  const starters = isCustomer ? CUSTOMER_STARTERS : RM_STARTERS;

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, open, sending]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const history = messages;
    setMessages((prev) => [...prev, { sender: 'user', text: trimmed }]);
    setInput('');
    setSending(true);
    try {
      const { reply } = await askAssistant(role, trimmed, history);
      setMessages((prev) => [...prev, { sender: 'assistant', text: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'assistant', text: err.message }]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      <button
        className="fabric-chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close Bank Chain Assistant' : 'Open Bank Chain Assistant'}
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="fabric-chat-panel" role="dialog" aria-label="Bank Chain Assistant chat">
          <div className="fabric-chat-header">
            <div>
              <div className="fabric-chat-title">Bank Chain Assistant</div>
              <div className="fabric-chat-sub">Your virtual Relationship Manager</div>
            </div>
            <button className="fabric-chat-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>

          <div className="fabric-chat-body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div key={i} className={`fabric-chat-bubble ${m.sender}`}>
                {m.text}
              </div>
            ))}
            {sending && (
              <div className="fabric-chat-bubble assistant fabric-chat-typing">
                <span />
                <span />
                <span />
              </div>
            )}

            {messages.length < 3 && (
              <div className="fabric-chat-starters">
                {starters.map((q) => (
                  <button key={q} className="fabric-chat-chip" onClick={() => sendMessage(q)} disabled={sending}>
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form className="fabric-chat-inputbar" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Bank Chain..."
              aria-label="Message"
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()}>Send</button>
          </form>

          <div className="fabric-chat-footer">
            Still need help? Contact your Relationship Manager or use Help &amp; Support.
          </div>
        </div>
      )}
    </>
  );
}
