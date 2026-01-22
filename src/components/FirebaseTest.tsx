import { useEffect, useState } from 'react';
import { getPackingRecords } from '../services/firebaseService';

export default function FirebaseTest() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const data = await getPackingRecords();
        setRecords(data);
        console.log('Firebase connected successfully!', data);
      } catch (err) {
        setError('Failed to connect to Firebase');
        console.error('Firebase error:', err);
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Firebase Connection Test</h2>
      {loading && <p>Testing connection...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <p>Records found: {records.length}</p>
      {records.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold">Sample Data:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(records[0], null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
