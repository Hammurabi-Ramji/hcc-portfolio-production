import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import './StripeIntegration.css';

const { FiCreditCard, FiLock, FiCheckCircle, FiX, FiLoader } = FiIcons;

const StripeIntegration = ({ amount, onSuccess, onCancel }) => {
  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const handlePayment = async () => {
    setProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      onSuccess({
        amount,
        last4: cardNumber.slice(-4),
        brand: 'Visa',
        date: new Date().toISOString()
      });
    }, 2000);
  };

  return (
    <motion.div 
      className="stripe-payment-modal"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div className="payment-header">
        <div className="payment-logo">
          <span>Stripe</span>
        </div>
        <button className="close-btn" onClick={onCancel}>
          <SafeIcon icon={FiX} />
        </button>
      </div>

      <div className="payment-amount">
        <span className="amount-label">Amount to pay</span>
        <span className="amount-value">${amount.toFixed(2)}</span>
      </div>

      <div className="payment-form">
        <div className="form-group">
          <label>Card Number</label>
          <div className="input-with-icon">
            <SafeIcon icon={FiCreditCard} />
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              className="payment-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Expiry</label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/YY"
              maxLength="5"
              className="payment-input"
            />
          </div>
          <div className="form-group">
            <label>CVC</label>
            <input
              type="text"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              placeholder="123"
              maxLength="3"
              className="payment-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Cardholder Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            className="payment-input"
          />
        </div>

        <label className="save-card-option">
          <input
            type="checkbox"
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
          />
          <span>Save card for future payments</span>
        </label>

        <div className="security-notice">
          <SafeIcon icon={FiLock} />
          <span>Your payment information is encrypted and secure</span>
        </div>
      </div>

      <div className="payment-actions">
        <button className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button 
          className="pay-btn" 
          onClick={handlePayment}
          disabled={processing || !cardNumber || !expiry || !cvc || !name}
        >
          {processing ? (
            <>
              <SafeIcon icon={FiLoader} className="spinning" />
              Processing...
            </>
          ) : (
            <>
              <SafeIcon icon={FiCheckCircle} />
              Pay ${amount.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default StripeIntegration;