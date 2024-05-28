import React from 'react';
import image from '../images/airplane.png';
import '../App.css';

export function Home() {
  return (
    <>
      <h1 className="centered-h1"> Flight Information System </h1>
      <div className="image-container">
        <img src={image}  className="centered-image" alt="Airplane"/>
      </div>
    </>
  );
}