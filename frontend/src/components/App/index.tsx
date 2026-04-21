import Box from '@mui/material/Box';
import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AdminViewProvider } from '../../contexts/AdminViewContext';
import Navbar from '../Navbar';
import HomePage from '../pages/HomePage/HomePage';
import Notifications from '../pages/Notifications/NotificationPage';
import TeamsList from '../pages/TeamPage/TeamsList';
import TeamDetails from '../pages/TeamPage/TeamDetail';
import Profile from '../pages/Dashbord/Profile';
import { CreateEquipe } from '../pages/TeamPage/CreateTeam';
import { MyTeam } from '../pages/TeamPage/MyTeam';
import LoginPage from '../pages/ConnectionPage/LoginPage';
import RegisterPage from '../pages/MySpace/RegisterPage';
import ProfilePage from '../pages/MySpace/ProfilePage';
import AdminPage from '../pages/Admin/AdminPage';
import { DemandesAdhesion } from '../pages/TeamPage/ResponsablePage/Demand';
import { TournoisResponsable } from '../pages/TeamPage/ResponsablePage/RegisterTournament';
import DisponibilitesPage from '../pages/MySpace/AvailabilitiesPage';
import ProtectedRoute from '../routes/ProtectedRoute';
import AdminRoute from '../routes/AdminRoute';
import ResponsableRoute from '../routes/ResponsableRoute';
import NonConnectePage from '../pages/PasAcces/UnconnectedPage';
import InterditPage from '../pages/PasAcces/ForbiddenPage';
import MemberDetails from '../pages/Member/MemberDetails';
import TournoiPage from '../pages/Tournaments/TournamentPage';
import TournoiDetailPage from '../pages/Tournaments/TournoiDetailPage';
import AdminTournamentsPage from '../pages/Tournaments/AdminTournamentsPage';
import CreateTournamentPage from '../pages/Tournaments/CreateTournament';
import EditTournamentPage from '../pages/Tournaments/EditTournament';
import TournamentMatchesPage from '../pages/Tournaments/TournamentMatchesPage';
import TournamentMatchCompositionPage from '../pages/Tournaments/TournamentMatchCompositionPage';

// ✨ IMPORT DE LA NOUVELLE PAGE DE VALIDATION
import MatchValidationPage from '../pages/Match/MatchValidationPage';

const appBlueGradient =
  'linear-gradient(180deg, #040a1a 0%, #080f2e 45%, #050812 100%)';

const App = () => (
  <AdminViewProvider>
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ScrollToTop />
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
            path="/tournois/:id/matchs"
            element={<TournamentMatchesPage />}
          />
          <Route
            path="/tournois/:id/matches"
            element={<TournamentMatchesPage />}
          />
          <Route
            path="/tournois/:id/matchs/:matchId"
            element={<TournamentMatchCompositionPage />}
          />
          <Route
            path="/tournois/:id/matches/:matchId"
            element={<TournamentMatchCompositionPage />}
          />
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

          {/* ✨ NOUVELLE ROUTE : PAGE DE VALIDATION DES MATCHS */}
          <Route
            path="/match/:id/validation"
            element={
              <ProtectedRoute>
                <MatchValidationPage />
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
  </AdminViewProvider>
);

export default App;
