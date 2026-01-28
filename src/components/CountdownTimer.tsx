import React, { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer() {
  const calculateTimeLeft = (): TimeLeft => {
    const targetDate = new Date('2026-02-16T09:00:00');
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  return (
    <div className="countdown-timer">
      <div className="countdown-label">Старт проекта через:</div>
      <div className="countdown-display">
        <div className="countdown-segment">
          <div className="countdown-value">{formatNumber(timeLeft.days)}</div>
          <div className="countdown-unit">дней</div>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-segment">
          <div className="countdown-value">{formatNumber(timeLeft.hours)}</div>
          <div className="countdown-unit">часов</div>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-segment">
          <div className="countdown-value">{formatNumber(timeLeft.minutes)}</div>
          <div className="countdown-unit">минут</div>
        </div>
        <div className="countdown-separator">:</div>
        <div className="countdown-segment">
          <div className="countdown-value">{formatNumber(timeLeft.seconds)}</div>
          <div className="countdown-unit">секунд</div>
        </div>
      </div>
      <div className="countdown-date">16 февраля 2026 // 09:00</div>
    </div>
  );
}
