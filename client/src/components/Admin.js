import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../config/api';
import PrivateRoute from './PrivateRoute';
import { useAuth } from '../context/AuthContext';
import './Admin.css';

const PAGE_SIZE = 20;

function AdminInner() {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');

  const [assets, setAssets] = useState([]);
  const [assetPage, setAssetPage] = useState(1);
  const [assetTotalPages, setAssetTotalPages] = useState(1);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetStatus, setAssetStatus] = useState('');
  const [assetCategory, setAssetCategory] = useState('');

  const isAdmin = user?.role === 'admin';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: { page: userPage, limit: PAGE_SIZE, search: userSearch || undefined },
      });
      setUsers(res.data.users || []);
      setUserTotalPages(res.data.pagination?.total || 1);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/assets', {
        params: {
          page: assetPage,
          limit: PAGE_SIZE,
          status: assetStatus || undefined,
          category: assetCategory || undefined,
          search: assetSearch || undefined,
        },
      });
      setAssets(res.data.assets || []);
      setAssetTotalPages(res.data.pagination?.total || 1);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === 'users') fetchUsers();
    if (tab === 'assets') fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, userPage, assetPage]);

  const onUpdateUserRole = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      toast.success('Role updated');
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update role');
    }
  };

  const onDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user and all their assets?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete user');
    }
  };

  const onUpdateAsset = async (assetId, changes) => {
    try {
      await api.put(`/admin/assets/${assetId}`, changes);
      toast.success('Asset updated');
      fetchAssets();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update asset');
    }
  };

  const onDeleteAsset = async (assetId) => {
    if (!window.confirm('Delete this asset?')) return;
    try {
      await api.delete(`/admin/assets/${assetId}`);
      toast.success('Asset deleted');
      fetchAssets();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete asset');
    }
  };

  if (!isAdmin) {
    return <div style={{ padding: '1rem' }}>Access denied.</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin Panel</h2>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Users</button>
        <button className={`admin-tab ${tab === 'assets' ? 'active' : ''}`} onClick={() => setTab('assets')}>Assets</button>
      </div>

      {tab === 'users' && (
        <div>
          <div className="admin-toolbar">
            <input className="admin-input" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            <button className="admin-button" onClick={() => { setUserPage(1); fetchUsers(); }}>Search</button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Role</th>
                <th>Creator</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.username || '-'}</td>
                  <td>
                    <span className={`admin-badge ${u.role}`}>{u.role}</span>
                  </td>
                  <td>{u.creator ? 'Yes' : 'No'}</td>
                  <td style={{ display:'flex', gap:8 }}>
                    <select className="admin-select" value={u.role} onChange={e => onUpdateUserRole(u.id, e.target.value)}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                    <button className="admin-button" onClick={() => onDeleteUser(u.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="admin-pagination">
            <button className="admin-button" disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}>Prev</button>
            <span>Page {userPage} of {userTotalPages}</span>
            <button className="admin-button" disabled={userPage >= userTotalPages} onClick={() => setUserPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {tab === 'assets' && (
        <div>
          <div className="admin-toolbar">
            <input className="admin-input" placeholder="Search assets..." value={assetSearch} onChange={e => setAssetSearch(e.target.value)} />
            <select className="admin-select" value={assetStatus} onChange={e => setAssetStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
            <select className="admin-select" value={assetCategory} onChange={e => setAssetCategory(e.target.value)}>
              <option value="">All categories</option>
              <option>Logo</option>
              <option>UI Kit</option>
              <option>Illustration</option>
              <option>Icon Set</option>
              <option>Template</option>
              <option>Mockup</option>
              <option>Other</option>
            </select>
            <button className="admin-button" onClick={() => { setAssetPage(1); fetchAssets(); }}>Filter</button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Creator</th>
                <th>Status</th>
                <th>Views</th>
                <th>Downloads</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(a => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td>{a.creator?.name || a.creator?.username || String(a.creator)}</td>
                  <td><span className={`admin-status ${a.status}`}>{a.status}</span></td>
                  <td>{a.views}</td>
                  <td>{a.downloads}</td>
                  <td style={{ display:'flex', gap:8 }}>
                    <select className="admin-select" value={a.status} onChange={e => onUpdateAsset(a.id, { status: e.target.value })}>
                      <option value="draft">draft</option>
                      <option value="published">published</option>
                      <option value="archived">archived</option>
                    </select>
                    <button className="admin-button" onClick={() => onDeleteAsset(a.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="admin-pagination">
            <button className="admin-button" disabled={assetPage <= 1} onClick={() => setAssetPage(p => p - 1)}>Prev</button>
            <span>Page {assetPage} of {assetTotalPages}</span>
            <button className="admin-button" disabled={assetPage >= assetTotalPages} onClick={() => setAssetPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {loading && <div style={{ marginTop: 8 }}>Loading...</div>}
    </div>
  );
}

export default function Admin() {
  return (
    <PrivateRoute>
      <AdminInner />
    </PrivateRoute>
  );
}


