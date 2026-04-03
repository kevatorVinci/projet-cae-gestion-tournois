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
import LoginPage from '../pages/ConnectionPage/LoginPage';
import RegisterPage from '../pages/Espace/RegisterPage';
import ProfilePage from '../pages/Espace/ProfilePage';
import AdminPage from '../pages/Admin/AdminPage';
import { DemandesAdhesion } from '../pages/TeamPage/ResponsablePage/Demande';
import { TournoisResponsable } from '../pages/TeamPage/ResponsablePage/Inscription';
import DisponibilitesPage from '../pages/Espace/DisponibilitesPage';
import ProtectedRoute from '../routes/ProtectedRoute';
import AdminRoute from '../routes/AdminRoute';
import ResponsableRoute from '../routes/ResponsableRoute';
import NonConnectePage from '../pages/PasAcces/NonConnectePage';
import InterditPage from '../pages/PasAcces/InterditPage';
import MemberDetails from '../pages/Member/MemberDetails';
import TournoiPage from '../pages/Tournois/TournoiPage';
import TournoiDetailPage from '../pages/Tournois/TournoiDetailPage';
import AdminTournamentsPage from '../pages/Tournois/AdminTournamentsPage';
import CreateTournamentPage from '../pages/Tournois/CreateTournament';
import EditTournamentPage from '../pages/Tournois/EditTournament';

const appBlueGradient =
  'linear-gradient(180deg, #040a1a 0%, #080f2e 45%, #050812 100%)';

const App = () => (
  <Router
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <Box sx={{ minHeight: '100vh', background: appBlueGradient }}>
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
            <ResponsableRoute>
              <DemandesAdhesion />
            </ResponsableRoute>
          }
        />
        <Route
          path="/tournois/gestion"
          element={
            <ResponsableRoute>
              <TournoisResponsable />
            </ResponsableRoute>
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
