import React, { useEffect, useState } from 'react';
import { fetchOverviewStats, clearCache, getApiMode } from './api';

function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchOverviewStats();
        // Extract data from APIResponse wrapper
        setStats(response.data || response);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load overview stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Add modal handlers
  const openModal = (url) => {
    setModalUrl(url);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalUrl('');
  };

  const handleRefresh = async () => {
    const apiMode = getApiMode();
    if (apiMode.isStatic) {
      alert('🎯 Demo Mode: Data refresh is not available in this static portfolio demonstration.\n\nThis demo uses static data from January 1, 2026. In the live version, this button would refresh data from the live API.');
      return;
    }
    
    try {
      setRefreshing(true);
      setError(null);
      // Clear cache first
      await clearCache();
      // Then reload data
      const response = await fetchOverviewStats();
      setStats(response.data || response);
    } catch (err) {
      setError(err.message);
      console.error('Failed to refresh overview stats:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <div>Loading overview statistics...</div>;
  
  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ color: 'red', marginBottom: '10px' }}>
          Error loading overview: {error}
        </div>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return <div>No data available</div>;

  const ageOrder = ["Puppy","Adult","Senior"];

  const labelMap = {
    "Puppy":"Puppies (0 to 1 year):",
    "Adult":"Adults:",
    "Senior":"Seniors (8+ years):"
  };

  const sortedAgeGroups = stats.ageGroups
    ? [...stats.ageGroups].sort((a, b) => {
        return ageOrder.indexOf(a.age_group) - ageOrder.indexOf(b.age_group);
      })
    : [];


  return (
    <div>
      {/* Move refresh button to the right of the heading */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
        <h2 style={{ margin: 0, textAlign: 'left' }}>Shelter Overview</h2>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing || loading}
          style={{ 
            display: 'none', // Hidden but not removed
            padding: '8px 16px', 
            backgroundColor: 'transparent', 
            color: '#007bff', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: refreshing || loading ? 'not-allowed' : 'pointer',
            opacity: refreshing || loading ? 0.6 : 1,
            fontSize: '32px'  // Increased from 16px to make the icon larger
          }}
          title="Refresh Data"
        >
          {refreshing ? 'Refreshing...' : '🔄'}
        </button>
      </div>
      <table style={{ width: "50%", marginTop: "16px", textAlign: "left", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td><strong>Available Dogs:</strong></td>
            <td>{stats.total}</td>
          </tr>
          <br />  {/* Added to preserve original line spacing */}
          <tr>
            <td><strong>New in the last 7 days:</strong></td>
            <td>{stats.newThisWeek}</td>
          </tr>
          <br />  {/* Added to preserve original line spacing */}
          <tr>
            <td><strong>Adopted in the last 7 days:</strong></td>
            <td>{stats.adoptedThisWeek}</td>
          </tr>
          <br />  {/* Added to preserve original line spacing */}
          <tr>
            <td><strong>Trial Adoptions:</strong></td>
            <td>{stats.trialAdoptions}</td>
          </tr>
          <br />  {/* Added to preserve original line spacing */}
          <tr>
            <td><strong>Average Length of Stay:</strong></td>
            <td>{stats.avgStay} days</td>
          </tr>
          <br />  {/* Added to preserve original line spacing */}
          <tr>
            <td><strong>Longest Stay:</strong></td>
            <td>{stats.longestStay.days} days (
              <span
                onClick={() => openModal(stats.longestStay.url)}
                style={{ color: "#2a5db0", textDecoration: "underline", cursor: "pointer", fontWeight: 'bold' }}
              >
                {stats.longestStay.name}
              </span>
            )</td>
          </tr>
          <br />  {/* Added to preserve original line spacing */}
          <tr>
            <td style={{ verticalAlign: "top" }}>
              <strong>Available Dogs by Age Group:</strong>
            </td>
            <td>
              <table style={{ marginLeft: "0", borderCollapse: "separate", borderSpacing: "10px 4px" }}>
                <tbody>
                  {sortedAgeGroups.map(item =>
                    labelMap[item.age_group] ? (
                      <tr key={item.age_group}>
                        <td style={{padding: "4px 20px", textAlign:"left"}}>
                            {labelMap[item.age_group]}
                        </td>
                        <td style={{padding: "4px 20px", textAlign:"right"}}>
                          {item.count}
                        </td>
                      </tr>
                    ) : null
                  )}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Add trend, alerts, small charts here */}
      {/* Modal for dog info with iframe, styled to match other tabs */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className="bg-white rounded-lg shadow-lg p-6 relative flex flex-col items-center justify-center"
            style={{
              width: 800,
              height: 800,
              maxWidth: 800,
              maxHeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'fixed',
              left: '50%',
              top: '10%',
              transform: 'translate(-50%, 0)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              background: 'rgba(255,255,255,0.97)'
            }}
          >
            <button
              className="absolute text-gray-500 hover:text-gray-700 bg-white rounded-full flex items-center justify-center shadow-md"
              onClick={closeModal}
              aria-label="Close"
              style={{
                top: 10,
                right: 10,
                width: 36,
                height: 36,
                fontSize: 24,
                border: 'none',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              ×
            </button>
            {/* Dog name heading above iframe, if available */}
            {(() => {
              try {
                const url = new URL(modalUrl);
                const name = url.searchParams.get('name');
                if (name) {
                  return (
                    <h2
                      className="text-2xl font-bold mb-4"
                      style={{
                        margin: 0,
                        textAlign: 'center',
                        width: '100%',
                        fontWeight: 700
                      }}
                    >
                      {name}
                    </h2>
                  );
                }
              } catch {}
              return null;
            })()}
            <iframe
              src={modalUrl}
              title="Dog Information"
              width="100%"
              height="100%"
              style={{ border: 'none', flex: 1 }}
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default OverviewTab;
