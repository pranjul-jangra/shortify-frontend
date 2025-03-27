import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [customName, setCustomName] = useState('');
  const [shortenedUrls, setShortenedUrls] = useState([]);

  const loaderRef = useRef();

  const BASE_URL = import.meta.env.VITE_SERVER_BASEURL;

  // Fetch all shortened URLs from backend
  async function fetchUrls() {
    try {
      const response = await axios.get(`${BASE_URL}/all-urls`);
      setShortenedUrls(response.data.urls);
    } catch (error) {
      console.error('Fetch URLs error:', error.response ? error.response.data : error.message);
      toast.error('Failed to fetch URLs');
    }
  }

  // Fetch URLs when component mounts
  useEffect(() => {
    fetchUrls();
  }, []);

  // Handle URL shortening
  async function handleSubmit(e) {
    e.preventDefault();

    if (!input.trim()) return toast.error('Please enter a valid URL');

    try {
      loaderRef.current.style.display = 'flex';
      const response = await axios.post(`${BASE_URL}/shorten`, { originalUrl: input, customName });
      
      toast.success('URL shortened successfully');
      setInput('');
      setCustomName('');
      fetchUrls();

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Something went wrong...');
    }finally{
      loaderRef.current.style.display = 'none';
    }
  }

  return (
    <main className="Viewport-container">

      <h1>Shorten any long URL</h1>

      <form onSubmit={handleSubmit}>

        <input type="text" placeholder="Enter the URL" value={input} onChange={(e) => setInput(e.target.value)} required aria-label="Original URL"/>

        <input type="text" placeholder="Custom name (optional)" value={customName} onChange={(e) => setCustomName(e.target.value)} aria-label="Custom name for the URL"/>

        <button type="submit" aria-label="Shorten the URL"> Shorten </button>

      </form>

      <ul>
        {shortenedUrls.length === 0 ? (
          <div>No shortened URLs yet...</div>
        ) : (
          shortenedUrls.map((data) => (
            <li key={data._id} aria-label={`${BASE_URL}/${data.shortId}`}>
              <p>Original URL</p>
              <a href={data.originalUrl} target="_blank" rel="noopener noreferrer">
                {data.originalUrl}
              </a>
              <p>Shortened URL</p>
              <a href={`${BASE_URL}/${data.shortId}`} target="_blank" rel="noopener noreferrer">
                {`${BASE_URL}/${data.shortId}`}
              </a>
            </li>
          ))
        )}
      </ul>

      <article ref={loaderRef} className='loader'><div></div></article>
      <ToastContainer position="top-right" autoClose={5000} />
    </main>
  );
}

export default App;
