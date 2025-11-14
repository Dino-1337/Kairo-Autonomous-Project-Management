import { useState } from 'react';
import axios from 'axios';

export const useProjectAgent = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const processRequest = async (userRequest, settings = {}) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('http://localhost:8000/process-request', {
        user_request: userRequest,
        settings: settings // PM controls
      });
      
      if (response.data.success) {
        setResult(response.data);
      } else {
        setError(response.data.error || 'Request failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  return { loading, result, error, processRequest };
};