import React, { useState, useEffect } from 'react';
import { Button, Container, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import getApiConfig from '../../config/api';
import './Pricing.css';

function Pricing() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pricingPlans, setPricingPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      const apiConfig = getApiConfig();
      const response = await axios.get(`${apiConfig.baseURL}/api/pricing/plans`);
      setPricingPlans(response.data);
    } catch (err) {
      setError('Failed to load pricing plans');
      console.error('Error fetching pricing plans:', err);
    } finally {
      setPlansLoading(false);
    }
  };

  const handleUpgrade = async (plan) => {
    if (!user) {
      setError('Please log in to upgrade your plan');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const apiConfig = getApiConfig();
      const response = await axios.post(
        `${apiConfig.baseURL}/api/auth/upgrade-premium`,
        { plan: plan.toLowerCase() },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setUser(response.data.user);
      setMessage(`🎉 Successfully upgraded to ${plan} plan! You now have a Golden Tick verification!`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upgrade plan');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pricing-page">
      <Container className="py-5">
        {message && (
          <Alert variant="success" className="mb-4">
            {message}
          </Alert>
        )}
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}
        <Row>
          <Col md={12} className="text-center mb-5">
            <h1 className="display-4 mb-3">
              <i className="fas fa-crown text-warning me-3"></i>
              Choose Your Plan
            </h1>
            <h2 className="mb-3">Unlock Premium Features</h2>
            <p className="lead text-muted">Choose the perfect plan for your creative needs</p>
          </Col>
        </Row>
        
        <Row className="justify-content-center">
          {plansLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading pricing plans...</span>
              </div>
            </div>
          ) : (
            pricingPlans.map((plan) => (
              <Col lg={4} md={6} className="mb-4" key={plan._id}>
                <div className={`pricing-card h-100 border ${plan.isPopular ? 'border-primary position-relative' : ''} ${plan.borderStyle ? `border-${plan.borderStyle}` : ''}`}>
                  {plan.isPopular && (
                    <div className="popular-badge">
                      <span className="badge bg-primary">Most Popular</span>
                    </div>
                  )}
                  <div 
                    className="pricing-header text-center p-4"
                    style={{ 
                      backgroundColor: plan.headerStyle?.backgroundColor || '#f8f9fa',
                      color: plan.headerStyle?.textColor || '#000000'
                    }}
                  >
                    <h3 className="pricing-title">{plan.displayName}</h3>
                    <div className="pricing-price">
                      <span className="currency">{plan.currency}</span>
                      <span className="amount">{plan.price}</span>
                      <span className="period">{plan.period}</span>
                    </div>
                    <p className="pricing-description">{plan.description}</p>
                  </div>
                  <div className="pricing-features p-4">
                    <ul className="list-unstyled">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="mb-3">
                          <i className={`fas ${feature.included ? 'fa-check text-success' : 'fa-times text-danger'} me-2`}></i>
                          <span className={feature.included ? '' : 'text-muted'}>{feature.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pricing-action p-4">
                    <Button 
                      variant={plan.buttonVariant || 'primary'}
                      className="w-100" 
                      onClick={() => handleUpgrade(plan.displayName)}
                      disabled={loading || (plan.price === 0 && plan.name === 'basic')}
                    >
                      {loading ? (
                        <>
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          Upgrading...
                        </>
                      ) : (
                        <>
                          {plan.price > 0 && <i className="fas fa-crown me-2"></i>}
                          {plan.buttonText || 'Upgrade'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Col>
            ))
          )}
        </Row>

        <Row className="mt-5">
          <Col md={12} className="text-center">
            <div className="guarantee-section p-4 bg-light rounded">
              <h3 className="mb-3">
                <i className="fas fa-shield-alt text-success me-2"></i>
                30-Day Money-Back Guarantee
              </h3>
              <p className="text-muted mb-3">
                Try any premium plan risk-free. If you're not completely satisfied, 
                we'll refund your money within 30 days.
              </p>
              <p className="text-muted">
                <i className="fas fa-credit-card me-2"></i>
                Cancel anytime • Secure payment processing • No hidden fees
              </p>
            </div>
          </Col>
        </Row>

        <Row className="mt-5">
          <Col md={12} className="text-center">
            <h3 className="mb-4">Frequently Asked Questions</h3>
            <div className="faq-section">
              <Row>
                <Col md={6} className="mb-3">
                  <div className="faq-item p-3 border rounded">
                    <h5>Can I change plans anytime?</h5>
                    <p className="text-muted mb-0">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="faq-item p-3 border rounded">
                    <h5>What payment methods do you accept?</h5>
                    <p className="text-muted mb-0">We accept all major credit cards, PayPal, and bank transfers.</p>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Pricing; 