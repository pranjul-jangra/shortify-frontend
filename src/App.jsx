import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [customName, setCustomName] = useState('');
  const [shortenedUrls, setShortenedUrls] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const loaderRef = useRef();
  const observerRef = useRef();
  const LIMIT = 10;

  const BASE_URL = import.meta.env.VITE_SERVER_BASEURL;

  const fetchUrls = async (pageNumber) => {
    if (!hasMore) return;
    setLoading(true);
    setIsFetching(true);
  
    try {
      const response = await axios.get(`${BASE_URL}/all-urls?page=${pageNumber}&limit=${LIMIT}`);
      
      if (pageNumber === 1) {
        setShortenedUrls(response.data.urls);
      } else {
        setShortenedUrls((prevUrls) => [...prevUrls, ...response.data.urls]);
      }

      if (response.data.urls.length === 0) {
        setHasMore(false);
      } else {
        setHasMore(response.data.hasMore);
      }

    } catch (error) {
      toast.error('Failed to fetch URLs');
    } finally {
      setLoading(false);
      setIsFetching(false);
      console.log("shortedURLS in fetch method", shortenedUrls);
    }
  };
  
  // Fetch URLs when component mounts
  useEffect(() => {
    console.log('useEffect re-runs...')
    fetchUrls(page);
  }, [page, fetchTrigger]);


  // Intersection Observer to detect when user scrolls near bottom
  const lastUrlRef = useCallback((node) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prevPage) => prevPage + 1);
      }
    });

    if (node) observerRef.current.observe(node);
  }, [loading, hasMore]);


  // Handle URL shortening
  async function handleSubmit(e) {
    e.preventDefault();
    console.log('handleSubmit button is triggered.')
  
    if (!input.trim()) return toast.error('Please enter a valid URL');
  
    try {
      loaderRef.current.style.display = 'flex';
      const response = await axios.post(`${BASE_URL}/shorten`, { originalUrl: input, customName });
      toast.success('URL shortened successfully');
  
      setInput('');
      setCustomName('');
      setPage(1);
      setHasMore(true);
      setFetchTrigger(prev => prev + 1);

      console.log('page:', page, "hasMore:", hasMore, "shortedURLS inside Button:", shortenedUrls);
  
    } catch (error) {
      toast.error(error.response?.data?.error || 'Something went wrong...');
    } finally {
      loaderRef.current.style.display = 'none';
    }
  }
  

  return (
    <main className="Viewport-container">
      <h1 aria-label='Shorten any long URL'>Shorten any long URL</h1>

      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Enter the URL" value={input} onChange={(e) => setInput(e.target.value)} required aria-label="Enter original URL"/>
        <input type="text" placeholder="Custom name (optional)" value={customName} onChange={(e) => setCustomName(e.target.value)} aria-label="Enter custom name for the URL"/>
        <button type="submit" aria-label="Shorten the URL"> Shorten </button>
      </form>

      <ul aria-label='All shortened urls'>
        {isFetching && <div>Getting The URLs...</div>}

        {
          (!isFetching && shortenedUrls.length === 0) ? (
            <div>No Shortened URLs Yet...</div>
          ) : (
            shortenedUrls.map((data, index) => (
              <li key={index} ref={index === shortenedUrls.length - 1 ? lastUrlRef : null} aria-label={`${BASE_URL}/${data.shortId}`}>
                <p>Original URL</p>
                <a href={data.originalUrl} target="_blank" rel="noopener noreferrer">
                  {data.originalUrl}
                </a>
                <p>Shortened URL</p>
                <a href={`${BASE_URL}/${data.shortId}`} target="_blank" rel="noopener noreferrer">
                  {`${BASE_URL}/${data.shortId}`}
                </a>
              </li>)
            )
          )
        }
      </ul>


      <article ref={loaderRef} className='loader'><div></div></article>
      <ToastContainer position="top-right" autoClose={5000} />
    </main>
  );
}

export default App;
