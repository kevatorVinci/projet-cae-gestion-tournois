import Box from '@mui/material/Box';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from '../Navbar';
import HomePage from '../pages/HomePage/HomePage';
import Notifications from '../pages/Notifications/NotificationPage';
import TeamsList from '../pages/TeamPage/TeamsList';
import TeamDetails from '../pages/TeamPage/TeamDetail';
import Profile from '../pages/TableauDebord/Profil';
import { CreateEquipe } from '../pages/TeamPage/CreeEquipe';
import { RejoindreEquipe } from '../pages/TeamPage/RejoidreEquipe';
import { MyTeam } from '../pages/TeamPage/MaTeam';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProfilePage from '../pages/ProfilePage';
import AdminPage from '../pages/AdminPage';
import { DemandesAdhesion } from '../pages/TeamPage/ResponsablePage/Demande';

const App = () => (
  <Router>
    <Box sx={{ minHeight: '100vh', backgroundColor: '#080b14' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/equipes" element={<TeamsList />} />
        <Route path="/equipes/creer" element={<CreateEquipe />} />
        <Route path="/equipes/rejoindre" element={<RejoindreEquipe />} />
        <Route path="/equipes/demande" element={<DemandesAdhesion />} />
        <Route path="/equipes/:id" element={<TeamDetails />} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/maTeam" element={<MyTeam />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Box>
  </Router>
);

export default App;
