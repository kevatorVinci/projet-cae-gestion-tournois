import Box from '@mui/material/Box';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from '../Navbar';
import HomePage from '../pages/HomePage/HomePage';
import Notifications from '../pages/Notifications/NotificationPage';
import TeamsList from '../pages/TeamPage/TeamsList';
import TeamDetails from '../pages/TeamPage/TeamDetail';
import Profile from '../pages/TableauDebord/Profil';
import { CreateEquipe } from '../pages/TeamPage/CreeEquipe';
import { MyTeam } from '../pages/TeamPage/MaTeam';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProfilePage from '../pages/ProfilePage';
import AdminPage from '../pages/AdminPage';
import { DemandesAdhesion } from '../pages/TeamPage/ResponsablePage/Demande';
import DisponibilitesPage from '../pages/DisponibilitesPage';
import ProtectedRoute from '../routes/ProtectedRoute';
import AdminRoute from '../routes/AdminRoute';
import NonConnectePage from '../pages/PasAcces/NonConnectePage';
import InterditPage from '../pages/PasAcces/InterditPage';
import MemberDetails from '../pages/Member/MemberDetails';
import TournoiPage from '../Tournois/TournoiPage';
import TournoiDetailPage from '../Tournois/TournoiDetailPage';
import AdminTournamentsPage from '../Tournois/AdminTournamentsPage';
import CreateTournamentPage from '../Tournois/CreateTournament';
import EditTournamentPage from '../Tournois/EditTournament';

const App = () => (
  <Router
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <Box sx={{ minHeight: '100vh', backgroundColor: '#080b14' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route path="/equipes" element={<TeamsList />} />
        <Route path="/tournois" element={<TournoiPage />} />
        <Route path="/tournois/:id" element={<TournoiDetailPage />} />
        <Route
          path="/equipes/creer"
          element={
            <ProtectedRoute>
              <CreateEquipe />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipes/demande"
          element={
            <ProtectedRoute>
              <DemandesAdhesion />
            </ProtectedRoute>
          }
        />
        <Route path="/equipes/:id" element={<TeamDetails />} />
        <Route
          path="/profil"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maTeam"
          element={
            <ProtectedRoute>
              <MyTeam />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tournaments/create"
          element={
            <AdminRoute>
              <CreateTournamentPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/tournaments/edit/:id"
          element={
            <AdminRoute>
              <EditTournamentPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/tournaments"
          element={
            <AdminRoute>
              <AdminTournamentsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="/disponibilites"
          element={
            <ProtectedRoute>
              <DisponibilitesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/pas-acces/non-connecte" element={<NonConnectePage />} />
        <Route path="/pas-acces/interdit" element={<InterditPage />} />
        <Route path="/players/:id" element={<MemberDetails />} />
      </Routes>
    </Box>
  </Router>
);

export default App;
