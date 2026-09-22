import React from 'react';
import './WhatsAppPreviewModal.css';

export default function WhatsAppPreviewModal({ isOpen, onClose, orderData }) {
  if (!isOpen || !orderData) return null;

  const {
    orderId = '2',
    customerName = 'Customer',
    phone = '+91 98809 56318',
    status = 'Pending',
    totalAmount = '0',
    address = ''
  } = orderData;

  const formattedPhone = phone.startsWith('+91') ? phone : `+91 ${phone.replace(/\D/g, '')}`;

  return (
    <div className="wa-modal-overlay" onClick={onClose}>
      <div className="wa-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Window Top Title Bar */}
        <div className="wa-modal-topbar">
          <div className="wa-modal-title">
            <span className="wa-live-badge">⚡ AUTOMATED META WHATSAPP BUSINESS DISPATCH</span>
            <span>Customer WhatsApp View (+91 {phone})</span>
          </div>
          <button className="wa-modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* WhatsApp App Mock Interface */}
        <div className="wa-app-window">
          
          {/* WhatsApp Header */}
          <div className="wa-app-header">
            <div className="wa-header-left">
              <div className="wa-avatar-box">
                <span className="wa-avatar-icon">🛍️</span>
              </div>
              <div className="wa-contact-info">
                <div className="wa-contact-name">
                  +91 98809 56318 <span className="wa-verified-badge" title="Official SakthiShop Verified Business">✓</span>
                </div>
                <div className="wa-business-subtitle">SakthiShop Official Notification Service</div>
              </div>
            </div>
            <div className="wa-header-actions">
              <span>📹</span>
              <span>📞</span>
              <span>🔍</span>
              <span>⋮</span>
            </div>
          </div>

          {/* WhatsApp Chat Canvas */}
          <div className="wa-chat-body">
            
            {/* Date Pill */}
            <div className="wa-date-pill">Today</div>

            {/* Meta Security Banner */}
            <div className="wa-meta-security-banner">
              🔒 This business uses a secure service from Meta to manage this chat. Click to learn more.
            </div>

            {/* Business Template Message Bubble */}
            <div className="wa-template-card">
              <div className="wa-card-header">
                <strong>Order Status Update: SakthiShop</strong>
              </div>
              <div className="wa-card-body">
                <p>Hello <strong>{customerName}</strong> 👋,</p>
                <p>Your SakthiShop Order <strong>#SKT{orderId}</strong> status has been updated to: <strong className="wa-status-highlight">{status}</strong>.</p>
                {address && <p className="wa-address-text">🚚 <em>Shipping Address: {address}</em></p>}
                <p style={{ marginTop: '8px' }}>Tap below to see the shipping dates & real-time tracking for your items 👇</p>
                <span className="wa-optout-text">To pause important order updates via WhatsApp, send STOP.</span>
                <span className="wa-timestamp">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓</span>
              </div>

              {/* Action Button inside WhatsApp template */}
              <a 
                href="/dashboard" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="wa-action-cta-button"
                onClick={(e) => {
                  e.preventDefault();
                  alert(`Redirecting customer to live tracking for Order #SKT${orderId}`);
                }}
              >
                <span>↗</span> Track Order here
              </a>
            </div>

            {/* Business Privacy Disclaimer */}
            <div className="wa-privacy-disclaimer">
              This business won't see if you read their messages until you reply or add them as a contact.
              <div className="wa-privacy-buttons">
                <button className="wa-privacy-btn block">🚫 Block</button>
                <button className="wa-privacy-btn stay">✓ Stay</button>
              </div>
            </div>

          </div>

          {/* Bottom Chat Bar */}
          <div className="wa-chat-input-bar">
            <span className="wa-input-icon">➕</span>
            <span className="wa-input-icon">😊</span>
            <div className="wa-input-placeholder">Type a message</div>
            <span className="wa-input-icon">🎙️</span>
          </div>

        </div>

      </div>
    </div>
  );
}
