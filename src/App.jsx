import { useState, useEffect, useRef, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

import Sidebar from './components/Sidebar.jsx';
import MapView from './components/MapView.jsx';
import Login from './components/Login.jsx';
import Toast from './components/Toast.jsx';
import useGPS from './hooks/ useGPS.js';
import { getAreaHa } from './utils.js';
import { me, logout as apiLogout } from './api/auth.js';
import {
  listFields, createField, updateField, deleteField as apiDeleteField,
} from './api/fields.js';
import styles from './App.module.css';

const LIBRARIES = ['geometry', 'places'];
const NO_FIELDS = [];

// ── Signed-in workspace ──────────────────────────────────────────────────
function Workspace({ user, onSignOut }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState(null);
  const [fields, setFields] = useState(NO_FIELDS);
  const [dbLoading, setDbLoading] = useState(true);
  const [syncState, setSyncState] = useState('connecting');
  const [selectedField, setSelectedField] = useState(null);
  const [dbError, setDbError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const mapViewRef = useRef(null);

  const notify = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);
  const notifyError = useCallback((message) => notify(message, 'error'), [notify]);

  const { currentLocation, locating, trackLocation } = useGPS(map, notifyError);

  // Close the mobile drawer when the window grows to desktop width
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 769px)');
    const handler = (e) => { if (e.matches) setSidebarOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const loadFields = useCallback(async () => {
    setSyncState('connecting');
    try {
      const rows = await listFields();
      setFields(rows);
      setDbError(null);
      setSyncState('synced');
    } catch (error) {
      console.error('Fields load error:', error);
      setDbError('Could not load your parcels. Check your connection and that the API is running.');
      setSyncState('error');
      if (error.status === 401) onSignOut?.();
    } finally {
      setDbLoading(false);
    }
  }, [onSignOut]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const hasUnsavedPlot = selectedField?.id === null;

  const handlePolygonComplete = ({ coordinates, area, areaHa }) => {
    setSelectedField({
      id: null,
      draftKey: Date.now(),
      coordinates,
      area,
      areaHa,
      crop: 'Unassigned',
      notes: '',
      farmerCode: '',
      ownerName: '',
    });
    setSidebarOpen(true);
  };

  const handleSaveField = async (values) => {
    if (!selectedField) return;
    setSaving(true);
    setSyncState('pending');
    try {
      const areaHa = getAreaHa(selectedField);
      if (selectedField.id) {
        const updated = await updateField(selectedField.id, {
          ...values,
          areaHa,
          // keep existing boundary on metadata-only edits
        });
        setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      } else {
        const created = await createField({
          coordinates: selectedField.coordinates,
          areaHa,
          ...values,
        });
        setFields((prev) => [created, ...prev]);
      }
      setSelectedField(null);
      setSyncState('synced');
      notify('Plot saved.', 'success');
    } catch (error) {
      console.error('Save error:', error);
      setSyncState('error');
      notify(error.message || 'Could not save the plot. Please try again.', 'error');
      if (error.status === 401) onSignOut?.();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (id) => {
    if (!window.confirm('Delete this parcel permanently? This cannot be undone.')) return;
    setSyncState('pending');
    try {
      await apiDeleteField(id);
      setFields((prev) => prev.filter((f) => f.id !== id));
      if (selectedField?.id === id) setSelectedField(null);
      setSyncState('synced');
      notify('Parcel deleted.', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      setSyncState('error');
      notify(error.message || 'Could not delete the parcel.', 'error');
      if (error.status === 401) onSignOut?.();
    }
  };

  const handleFlyToField = (field) => {
    mapViewRef.current?.panToField?.(field);
    setSidebarOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.warn('Logout request failed:', e);
    }
    onSignOut?.();
  };

  if (loadError) {
    return (
      <div className={styles.statusMessage}>
        Google Maps failed to load. Check VITE_GOOGLE_MAPS_API_KEY.
      </div>
    );
  }

  if (!isLoaded) {
    return <div className={styles.statusMessage}>Loading map…</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#FAF7F2' }}>
      <style>{`
        .mobile-topbar { display: none; }
        @media (max-width: 768px) {
          .mobile-topbar {
            display: flex; position: fixed; top: 0; left: 0; right: 0; z-index: 40;
            height: 52px; align-items: center; justify-content: space-between;
            padding: 0 12px; background: #FAF7F2; border-bottom: 1px solid #E6E0D6;
          }
          .map-push-down { padding-top: 52px; }
        }
      `}</style>

      {toast && (
        <Toast key={toast.id} message={toast.message} type={toast.type} onDone={dismissToast} />
      )}

      <div className="mobile-topbar">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
          style={{
            background: '#2B2420', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          ☰ Menu
        </button>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#2B2420' }}>FarmTrack</span>
        <button
          type="button"
          onClick={trackLocation}
          aria-label="Locate me"
          style={{
            background: '#5B7B5A', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '8px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          ⌖ GPS
        </button>
      </div>

      {dbError && (
        <div
          role="alert"
          style={{
            position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
            background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FCA5A5',
            borderRadius: 8, padding: '8px 14px', fontSize: 13, maxWidth: '90%',
          }}
        >
          {dbError}
        </div>
      )}

      <Sidebar
        onLocateClick={trackLocation}
        locating={locating}
        selectedField={selectedField}
        fields={fields}
        onSaveField={handleSaveField}
        onCancel={() => setSelectedField(null)}
        onDeleteField={handleDeleteField}
        onFlyToField={handleFlyToField}
        saving={saving}
        dbLoading={dbLoading}
        syncState={dbLoading ? 'connecting' : syncState}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        userEmail={user.email}
        onSignOut={handleSignOut}
      />

      <div className="map-push-down" style={{ flex: 1, height: '100vh', display: 'flex' }}>
        <MapView
          ref={mapViewRef}
          currentLocation={currentLocation}
          fields={fields}
          draftField={hasUnsavedPlot ? selectedField : null}
          selectedFieldId={selectedField?.id ?? null}
          onMapLoad={setMap}
          onPolygonComplete={handlePolygonComplete}
          hasUnsavedPlot={hasUnsavedPlot}
          onSelectField={(field) => { setSelectedField(field); setSidebarOpen(true); }}
          onNotify={notify}
        />
      </div>
    </div>
  );
}

// ── Auth gate ────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(undefined); // undefined = still checking

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await me();
        if (!cancelled) setUser(u);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (user === undefined) {
    return <div className={styles.statusMessage}>Loading…</div>;
  }
  if (!user) {
    return <Login onAuthenticated={setUser} />;
  }
  return (
    <Workspace
      user={user}
      onSignOut={() => setUser(null)}
    />
  );
}
