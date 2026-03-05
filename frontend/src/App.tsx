import Box from '@mui/material/Box';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import HomePage from './components/pages/HomePage/HomePage';

const App = () => (
  <Router>
    <Box sx={{ minHeight: '100vh', backgroundColor: '#080b14' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Box>
  </Router>
);

export default App;
