import Box from '@mui/material/Box';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from '../Navbar';
import HomePage from '../pages/HomePage/HomePage';
// 1. On importe ta nouvelle page d'inscription ! 📝
import RegisterPage from '../pages/RegisterPage';

const App = () => (
  <Router>
    <Box sx={{ minHeight: '100vh', backgroundColor: '#080b14' }}>
      <Navbar />
      <Routes>
        {/* La route pour la page d'accueil */}
        <Route path="/" element={<HomePage />} />

        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Box>
  </Router>
);

export default App;
