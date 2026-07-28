import { useState } from 'react';

const CUSTOMER_FAQS = [
  {
    q: 'What is Bank Chain / the Digital Asset Fabric?',
    a: "It's Lloyds' platform for tokenizing real-world assets — property, bonds, shares and commodities — so you can view, transfer, and manage them digitally, with programmable inheritance and real-time valuation.",
  },
  {
    q: 'What kinds of assets can I put on Bank Chain?',
    a: 'Property, bonds, shares, and commodities can all be issued as digital tokens tied to the underlying asset, viewable from "My Assets".',
  },
  {
    q: 'How do I issue a new digital asset?',
    a: 'Go to "Issue Asset" in the sidebar, fill in the asset details, and submit. Your request goes into the Issuance Queue for approval before the token is created.',
  },
  {
    q: 'How does Transfer / DvP work?',
    a: '"Transfer / DvP" lets you move an asset to another party as a delivery-versus-payment transaction, so the asset and payment settle together. Transfers need confirmation before they settle.',
  },
  {
    q: 'What is KYC and why do I need it?',
    a: 'KYC (Know Your Customer) verifies your identity so you can hold and transact in tokenized assets. Complete it from the "KYC" screen — some actions are locked until it\'s approved.',
  },
  {
    q: 'How does Inheritance work?',
    a: '"Inheritance" lets you set up programmable succession rules for your assets, so they pass to your chosen beneficiaries automatically under the conditions you define.',
  },
  {
    q: 'How do I claim a property left to me?',
    a: 'Use "Claim a Property" and follow the identity and ownership verification steps. Your claim is reviewed by the bank before the asset is transferred to you.',
  },
  {
    q: 'What is Recovery for?',
    a: '"Recovery" lets you regain access to your digital assets if you lose your credentials or need to restore control, subject to identity verification and bank approval.',
  },
  {
    q: 'Is Bank Chain secure?',
    a: 'Yes — the platform is permissioned, programmable, and regulator-ready. Every action (issuance, transfer, approval) is recorded on an auditable ledger.',
  },
  {
    q: 'Who do I contact for more help?',
    a: 'Use "Help & Support" in the top bar, or speak to your Relationship Manager for anything this assistant can\'t answer.',
  },
];

const RM_FAQS = [
  {
    q: 'What is Bank Chain / the Digital Asset Fabric?',
    a: "It's Lloyds' platform for tokenizing real-world assets — property, bonds, shares and commodities — giving customers digital ownership with programmable inheritance, while giving you (the RM) approval and oversight tools.",
  },
  {
    q: 'What is the Issuance Queue?',
    a: 'It lists customer requests to issue new digital assets, waiting for your review and approval before the token is created on-chain.',
  },
  {
    q: 'What are Transfer Confirmations?',
    a: 'Customer-initiated transfers (DvP) that need your confirmation before the asset and payment legs settle.',
  },
  {
    q: 'How do KYC Approvals work?',
    a: 'Customer KYC submissions land here for your review — approve or reject to unlock the customer\'s ability to transact in digital assets.',
  },
  {
    q: 'What does Recovery cover for RMs?',
    a: 'Recovery requests from customers who\'ve lost access to their assets are routed here for identity verification and approval before access is restored.',
  },
  {
    q: 'What is "Look Up a Customer" for?',
    a: 'It lets you search for a customer and view their digital asset holdings, KYC status, and claims in one place.',
  },
  {
    q: 'What is the Audit Trail?',
    a: 'A full, timestamped record of every issuance, transfer, approval, and status change across the platform — for compliance and regulatory review.',
  },
  {
    q: 'Is Bank Chain secure and compliant?',
    a: 'Yes — the platform is permissioned, programmable, and regulator-ready. Every action is recorded on an auditable ledger.',
  },
];

export default function FaqChatbot({ isCustomer }) {
  const [open, setOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = isCustomer ? CUSTOMER_FAQS : RM_FAQS;

  function toggleQuestion(i) {
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <>
      <button
        className="fabric-chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close FAQ chat' : 'Open FAQ chat'}
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="fabric-chat-panel" role="dialog" aria-label="Bank Chain FAQ assistant">
          <div className="fabric-chat-header">
            <div>
              <div className="fabric-chat-title">Bank Chain Assistant</div>
              <div className="fabric-chat-sub">Frequently asked questions</div>
            </div>
            <button className="fabric-chat-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>

          <div className="fabric-chat-body">
            <p className="fabric-chat-intro">
              Hi, I'm here to help with questions about Bank Chain's Digital Asset Fabric. Tap a question below.
            </p>
            {faqs.map((item, i) => (
              <div key={item.q} className="fabric-chat-faq">
                <button
                  className="fabric-chat-question"
                  onClick={() => toggleQuestion(i)}
                  aria-expanded={openIndex === i}
                >
                  <span>{item.q}</span>
                  <span>{openIndex === i ? '−' : '+'}</span>
                </button>
                {openIndex === i && <div className="fabric-chat-answer">{item.a}</div>}
              </div>
            ))}
          </div>

          <div className="fabric-chat-footer">
            Still need help? Contact your Relationship Manager or use Help &amp; Support.
          </div>
        </div>
      )}
    </>
  );
}
