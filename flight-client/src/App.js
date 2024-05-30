import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import FlightInfo from './pages/FlightInfo';
import FlightStatus from './pages/FlightStatus';
import AirportFinder from './pages/AirportFinder';
import AirportInfo from './pages/AirportInfo';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/flightinfo" element={<FlightInfo />} />
          <Route path="/flightstatus" element={<FlightStatus />} />
          <Route path="/airportfinder" element={<AirportFinder />} />
          <Route path="/airportinfo" element={<AirportInfo />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
