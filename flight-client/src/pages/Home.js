import React from 'react';
import { useNavigate } from 'react-router-dom';
import image from '../images/airplane.png';
import '../App.css';

const Home = () => {
  const navigate = useNavigate();

  const navigateTo = (path) => {
    navigate(path);
  };

  return (
    <>
      <h1 className="centered-h1">Flight Information System</h1>
      <div className="image-container">
        <img src={image} className="centered-image" alt="Airplane" />
      </div>
      <div className="button-container">
        <button onClick={() => navigateTo('/flightinfo')}>Flight Information</button>
        <button onClick={() => navigateTo('/flightstatus')}>Flight Status</button>
        <button onClick={() => navigateTo('/airportfinder')}>Airport Finder</button>
        <button onClick={() => navigateTo('/airportinfo')}>Airport Information</button>
      </div>
    </>
  );
};

export default Home;
