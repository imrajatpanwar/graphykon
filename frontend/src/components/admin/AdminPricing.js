import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Form, Button, Alert, Badge } from 'react-bootstrap';
import getApiConfig from '../../config/api';

const AdminPricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    price: 0,
    currency: '$',
    period: '/month',
    features: [],
    isPopular: false,
    isActive: true,
    order: 0,
    buttonText: 'Upgrade',
    buttonVariant: 'primary',
    headerStyle: {
      backgroundColor: '#007bff',
      textColor: '#ffffff'
    },
    borderStyle: 'primary'
  });
  const [newFeature, setNewFeature] = useState({ text: '', included: true });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const apiConfig = getApiConfig();
      const response = await axios.get(`${apiConfig.baseURL}/api/pricing/admin/plans`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setPlans(response.data);
    } catch (err) {
      setError('Failed to load pricing plans');
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
      }));
    }
  };

  const handleAddFeature = () => {
    if (newFeature.text.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature]
      }));
      setNewFeature({ text: '', included: true });
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleToggleFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => 
        i === index ? { ...feature, included: !feature.included } : feature
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const apiConfig = getApiConfig();
      const url = editingPlan 
        ? `${apiConfig.baseURL}/api/pricing/admin/plans/${editingPlan._id}`
        : `${apiConfig.baseURL}/api/pricing/admin/plans`;
      
      const method = editingPlan ? 'PUT' : 'POST';
      
      await axios({
        method,
        url,
        data: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setShowModal(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (err) {
      setError(`Failed to ${editingPlan ? 'update' : 'create'} pricing plan`);
      console.error('Error saving plan:', err);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      period: plan.period,
      features: plan.features,
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      order: plan.order,
      buttonText: plan.buttonText,
      buttonVariant: plan.buttonVariant,
      headerStyle: plan.headerStyle,
      borderStyle: plan.borderStyle
    });
    setShowModal(true);
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Are you sure you want to delete this pricing plan?')) {
      try {
        const apiConfig = getApiConfig();
        await axios.delete(`${apiConfig.baseURL}/api/pricing/admin/plans/${planId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchPlans();
      } catch (err) {
        setError('Failed to delete pricing plan');
        console.error('Error deleting plan:', err);
      }
    }
  };

  const handleInitializeDefault = async () => {
    if (window.confirm('Initialize default pricing plans? This will create the basic pricing structure.')) {
      try {
        const apiConfig = getApiConfig();
        await axios.post(`${apiConfig.baseURL}/api/pricing/admin/initialize`, {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchPlans();
      } catch (err) {
        setError('Failed to initialize default plans');
        console.error('Error initializing plans:', err);
      }
    }
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      price: 0,
      currency: '$',
      period: '/month',
      features: [],
      isPopular: false,
      isActive: true,
      order: 0,
      buttonText: 'Upgrade',
      buttonVariant: 'primary',
      headerStyle: {
        backgroundColor: '#007bff',
        textColor: '#ffffff'
      },
      borderStyle: 'primary'
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-pricing">
      <div className="admin-header-actions">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h3>
              <i className="fas fa-tags me-2"></i>
              Pricing Plans Management
            </h3>
            <p className="text-muted">Manage subscription plans and pricing</p>
          </div>
          <div>
            <Button 
              variant="outline-primary" 
              className="me-2"
              onClick={handleInitializeDefault}
            >
              <i className="fas fa-magic me-2"></i>
              Initialize Default
            </Button>
            <Button 
              variant="primary" 
              onClick={openCreateModal}
            >
              <i className="fas fa-plus me-2"></i>
              Add New Plan
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="row">
        {plans.map((plan) => (
          <div key={plan._id} className="col-lg-4 col-md-6 mb-4">
            <div className={`card h-100 ${plan.isActive ? '' : 'opacity-50'}`}>
              <div 
                className="card-header text-center" 
                style={{ 
                  backgroundColor: plan.headerStyle.backgroundColor,
                  color: plan.headerStyle.textColor 
                }}
              >
                <h5 className="mb-0">{plan.displayName}</h5>
                {plan.isPopular && (
                  <Badge bg="warning" className="mt-1">Most Popular</Badge>
                )}
              </div>
              <div className="card-body">
                <div className="text-center mb-3">
                  <h2>
                    {plan.currency}{plan.price}
                    <small className="text-muted">{plan.period}</small>
                  </h2>
                  <p className="text-muted">{plan.description}</p>
                </div>
                
                <div className="features-list mb-3">
                  <h6>Features:</h6>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="d-flex align-items-center mb-2">
                        <i className={`fas ${feature.included ? 'fa-check text-success' : 'fa-times text-danger'} me-2`}></i>
                        <span className={feature.included ? '' : 'text-muted'}>{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="d-flex justify-content-between text-muted small">
                  <span>Order: {plan.order}</span>
                  <span>Status: {plan.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <div className="card-footer bg-transparent">
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={() => handleEdit(plan)}
                  >
                    <i className="fas fa-edit"></i>
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => handleDelete(plan._id)}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingPlan ? 'Edit Pricing Plan' : 'Create New Pricing Plan'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Internal Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Display Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Price</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Currency</Form.Label>
                  <Form.Control
                    type="text"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Period</Form.Label>
                  <Form.Select
                    name="period"
                    value={formData.period}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="/month">Monthly</option>
                    <option value="/year">Yearly</option>
                    <option value="/week">Weekly</option>
                    <option value="">One-time</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Order</Form.Label>
                  <Form.Control
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    min="0"
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Button Text</Form.Label>
                  <Form.Control
                    type="text"
                    name="buttonText"
                    value={formData.buttonText}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Button Variant</Form.Label>
                  <Form.Select
                    name="buttonVariant"
                    value={formData.buttonVariant}
                    onChange={handleInputChange}
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="danger">Danger</option>
                    <option value="outline-primary">Outline Primary</option>
                    <option value="outline-secondary">Outline Secondary</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Header Background Color</Form.Label>
                  <Form.Control
                    type="color"
                    name="headerStyle.backgroundColor"
                    value={formData.headerStyle.backgroundColor}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Header Text Color</Form.Label>
                  <Form.Control
                    type="color"
                    name="headerStyle.textColor"
                    value={formData.headerStyle.textColor}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <Form.Check
                  type="checkbox"
                  name="isPopular"
                  label="Mark as Popular"
                  checked={formData.isPopular}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-4">
                <Form.Check
                  type="checkbox"
                  name="isActive"
                  label="Active"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <hr />

            <h6>Features</h6>
            <div className="row mb-3">
              <div className="col-md-8">
                <Form.Control
                  type="text"
                  placeholder="Feature description"
                  value={newFeature.text}
                  onChange={(e) => setNewFeature({ ...newFeature, text: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <Form.Check
                  type="checkbox"
                  label="Included"
                  checked={newFeature.included}
                  onChange={(e) => setNewFeature({ ...newFeature, included: e.target.checked })}
                />
              </div>
              <div className="col-md-2">
                <Button variant="outline-primary" onClick={handleAddFeature}>
                  <i className="fas fa-plus"></i>
                </Button>
              </div>
            </div>

            <div className="features-list">
              {formData.features.map((feature, index) => (
                <div key={index} className="d-flex align-items-center mb-2">
                  <Form.Check
                    type="checkbox"
                    checked={feature.included}
                    onChange={() => handleToggleFeature(index)}
                    className="me-2"
                  />
                  <span className={`flex-grow-1 ${feature.included ? '' : 'text-muted'}`}>
                    {feature.text}
                  </span>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => handleRemoveFeature(index)}
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                </div>
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPricing; 