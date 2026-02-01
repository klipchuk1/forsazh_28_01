import CountdownTimer from './CountdownTimer';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <video className="landing-video" autoPlay muted loop playsInline>
        <source src="/forsazh.mp4" type="video/mp4" />
      </video>

      <div className="landing-overlay">
        <div className="landing-content">
          <CountdownTimer />
        </div>
      </div>
    </div>
  );
}
