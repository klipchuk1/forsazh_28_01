import CountdownTimer from './CountdownTimer';
import logoImage from '../assets/logo.png';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <video className="landing-video" autoPlay muted loop playsInline>
        <source src="/forsazh.mp4" type="video/mp4" />
      </video>

      <div className="landing-overlay">
        <div className="landing-content">
          <img src={logoImage} alt="Форсаж" className="landing-logo" />
          <CountdownTimer />
        </div>
      </div>
    </div>
  );
}
