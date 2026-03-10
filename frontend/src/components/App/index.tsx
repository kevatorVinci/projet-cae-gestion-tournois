import Box from '@mui/material/Box';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from '../Navbar';
import HomePage from '../pages/HomePage/HomePage';
import Notifications from '../pages/Notifications/Notif_page';

const App = () => (
  <Router>
    <Box sx={{ minHeight: '100vh', backgroundColor: '#080b14' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </Box>
  </Router>
);

export default App;
