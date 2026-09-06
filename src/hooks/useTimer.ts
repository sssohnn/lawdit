import { useState, useEffect } from 'react';

export interface TimerPreset {
  label: string;
  val: number;
}

export const TIMER_PRESETS: TimerPreset[] = [
  { label: '60분 (기본)', val: 3600 },
  { label: '70분 (민사 2문)', val: 4200 },
  { label: '120분 (본시험)', val: 7200 },
];

export function useTimer(defaultSeconds: number = 3600) {
  const [selectedDuration, setSelectedDuration] = useState<number>(defaultSeconds);
  const [timeLeft, setTimeLeft] = useState<number>(defaultSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isTimerPickerOpen, setIsTimerPickerOpen] = useState<boolean>(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeLeft]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleTimerReset = (duration: number = selectedDuration) => {
    setIsTimerRunning(false);
    setSelectedDuration(duration);
    setTimeLeft(duration);
    setIsTimerPickerOpen(false);
  };

  const toggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  return {
    selectedDuration,
    timeLeft,
    isTimerRunning,
    isTimerPickerOpen,
    setIsTimerPickerOpen,
    formattedTime: formatTimer(timeLeft),
    handleTimerReset,
    toggleTimer,
    presets: TIMER_PRESETS,
  };
}