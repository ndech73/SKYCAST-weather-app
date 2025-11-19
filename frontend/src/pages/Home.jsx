import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Home = () => {
  const [msg, setMsg] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/test')
      .then(res => setMsg(res.data.message))
      .catch(err => setMsg('Error connecting to backend'));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Weather App Test</h1>
      <p>{msg}</p>
    </div>
  );
};

export default Home;
