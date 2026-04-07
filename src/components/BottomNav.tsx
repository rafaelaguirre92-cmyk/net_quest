import { NavLink } from 'react-router-dom';
import { Home, ScanLine, Users, Compass, Briefcase } from 'lucide-react';

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink
        to="/home"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Home />
        <span>Inicio</span>
      </NavLink>
      <NavLink
        to="/experiences"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Compass />
        <span>Experiencias</span>
      </NavLink>
      <NavLink
        to="/scan"
        className={({ isActive }) => `bottom-nav-item bottom-nav-scan ${isActive ? 'active' : ''}`}
      >
        <div className="scan-icon-wrapper">
          <ScanLine />
        </div>
        <span>Escanear</span>
      </NavLink>
      <NavLink
        to="/jobs"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Briefcase />
        <span>Vacantes</span>
      </NavLink>
      <NavLink
        to="/contacts"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Users />
        <span>Contactos</span>
      </NavLink>
    </nav>
  );
}
