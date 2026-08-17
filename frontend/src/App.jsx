import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Donate from "./pages/Donate";
import GetInvolved from "./pages/GetInvolved";
import Home from "./pages/Home";
import Impact from "./pages/Impact";
import ImpactUpdates from "./pages/ImpactUpdates";
import Login from "./pages/Login";
import Mission from "./pages/Mission";
import MissionDetail from "./pages/MissionDetail";
import MyImpact from "./pages/MyImpact";
import News from "./pages/News";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Register from "./pages/Register";
import Reports from "./pages/Reports";
import Stories from "./pages/Stories";
import Transparency from "./pages/Transparency";
import VerifyTransaction from "./pages/VerifyTransaction";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <div className="layout">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/mission" element={<Mission />} />
        <Route path="/mission/:focusArea" element={<MissionDetail />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/transparency" element={<Transparency />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/impact" element={<Impact />} />
        <Route path="/impact-updates" element={<ImpactUpdates />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/get-involved" element={<GetInvolved />} />
        <Route path="/news" element={<News />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/verify" element={<VerifyTransaction />} />
        <Route path="/my-impact" element={<MyImpact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
