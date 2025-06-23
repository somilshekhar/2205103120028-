import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { Button, TextField, Typography, Box, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import Log from '../../LoggingMiddleware/index.js';

const URLShortener = () => {
  const [urls, setUrls] = useState([{ longUxrl: '', validity: 30, shortcode: '' }]);
  const [shortenedUrls, setShortenedUrls] = useState([]);

  const handleInputChange = (index, field, value) => {
    const newUrls = [...urls];
    newUrls[index][field] = value;
    setUrls(newUrls);
  };

  const shortenUrl = async () => {
    urls.forEach(async (url) => {
      if (!url.longUrl) {
        Log('frontend', 'error', 'component', 'Empty URL provided');
        return;
      }
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl: url.longUrl, validity: url.validity, shortcode: url.shortcode || '' }),
      });
      const data = await response.json();
      if (data.shortUrl) {
        setShortenedUrls(prev => [...prev, { ...data, originalUrl: url.longUrl, expiry: new Date(Date.now() + url.validity * 60000) }]);
        Log('frontend', 'info', 'component', `Shortened URL created: ${data.shortUrl}`);
      } else {
        Log('frontend', 'error', 'component', `Failed to shorten URL: ${data.error}`);
      }
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>URL Shortener</Typography>
      {urls.map((url, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <TextField label="Long URL" value={url.longUrl} onChange={(e) => handleInputChange(index, 'longUrl', e.target.value)} fullWidth sx={{ mb: 1 }} />
          <TextField label="Validity (minutes)" type="number" value={url.validity} onChange={(e) => handleInputChange(index, 'validity', e.target.value)} sx={{ mb: 1 }} />
          <TextField label="Custom Shortcode" value={url.shortcode} onChange={(e) => handleInputChange(index, 'shortcode', e.target.value)} sx={{ mb: 1 }} />
        </Box>
      ))}
      {urls.length < 5 && <Button onClick={() => setUrls([...urls, { longUrl: '', validity: 30, shortcode: '' }])}>Add URL</Button>}
      <Button variant="contained" onClick={shortenUrl} sx={{ mt: 2 }}>Shorten URLs</Button>
      {shortenedUrls.length > 0 && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="h6">Shortened URLs</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Original URL</TableCell>
                <TableCell>Short URL</TableCell>
                <TableCell>Expiry Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shortenedUrls.map((url, index) => (
                <TableRow key={index}>
                  <TableCell>{url.originalUrl}</TableCell>
                  <TableCell><Link to={`/r/${url.shortUrl}`}>{url.shortUrl}</Link></TableCell>
                  <TableCell>{url.expiry.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

const URLStatistics = () => {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
    };
    fetchStats();
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>URL Statistics</Typography>
      {stats.length > 0 ? (
        <Paper sx={{ p: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Short URL</TableCell>
                <TableCell>Creation Date</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell>Total Clicks</TableCell>
                <TableCell>Click Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.map((stat, index) => (
                <TableRow key={index}>
                  <TableCell>{stat.shortUrl}</TableCell>
                  <TableCell>{new Date(stat.creationDate).toLocaleString()}</TableCell>
                  <TableCell>{new Date(stat.expiryDate).toLocaleString()}</TableCell>
                  <TableCell>{stat.totalClicks}</TableCell>
                  <TableCell>
                    {stat.clickData.map((click, i) => (
                      <div key={i}>
                        {click.timestamp} - {click.source} - {click.location}
                      </div>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      ) : <Typography>No statistics available</Typography>}
    </Box>
  );
};

const RedirectPage = () => {
  const { shortUrl } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = async () => {
      const response = await fetch(`/api/redirect/${shortUrl}`);
      const data = await response.json();
      if (data.longUrl) {
        Log('frontend', 'info', 'page', `Redirecting to ${data.longUrl}`);
        window.location.href = data.longUrl;
      } else {
        Log('frontend', 'error', 'page', `Invalid short URL: ${shortUrl}`);
        navigate('/404');
      }
    };
    redirect();
  }, [shortUrl, navigate]);

  return <Typography>Redirecting...</Typography>;
};

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<URLShortener />} />
      <Route path="/stats" element={<URLStatistics />} />
      <Route path="/r/:shortUrl" element={<RedirectPage />} />
      <Route path="/404" element={<Typography>Page Not Found</Typography>} />
    </Routes>
  </BrowserRouter>
);

export default App;