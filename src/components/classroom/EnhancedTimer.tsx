import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Play,
  Clock,
  Plus,
  Minus,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClassroomTheme } from "@/contexts/ClassroomThemeContext";

interface EnhancedTimerProps {
  className?: string;
}

export function EnhancedTimer({ className }: EnhancedTimerProps) {
  const [timerTime, setTimerTime] = useState(0);
  const [timerWindow, setTimerWindow] = useState<Window | null>(null);
  const { currentTheme } = useClassroomTheme();

  // Preset times in seconds
  const presets = [
    { label: "1 min", seconds: 60 },
    { label: "2 min", seconds: 120 },
    { label: "5 min", seconds: 300 },
    { label: "10 min", seconds: 600 },
    { label: "15 min", seconds: 900 },
    { label: "20 min", seconds: 1200 },
  ];

  const setPresetTime = (seconds: number) => {
    setTimerTime(seconds);
  };

  const adjustTime = (seconds: number) => {
    setTimerTime((prev) => Math.max(0, prev + seconds));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimerInWindow = () => {
    if (timerTime === 0) return;
    
    // Close any existing timer window
    if (timerWindow && !timerWindow.closed) {
      timerWindow.close();
    }

    const width = 700;
    const height = 500;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
            const theme = {
              gradient: `${currentTheme.gradient}`,
              containerBg: `${currentTheme.containerBg}`
            };

    const newWindow = window.open(
      '',
      'classroom-timer',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes`
    );

    if (newWindow) {
      setTimerWindow(newWindow);
      
      newWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Classroom Timer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: ${theme.gradient};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      overflow: hidden;
      padding: clamp(10px, 3vw, 40px);
    }
    .timer-wrapper {
      position: relative;
      width: 100%;
      max-width: min(90vw, 90vh);
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .timer-container {
      text-align: center;
      background: ${theme.containerBg};
      backdrop-filter: blur(20px);
      border-radius: clamp(16px, 3vw, 24px);
      padding: clamp(30px, 5vw, 60px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
      z-index: 10;
    }
    .timer-display {
      font-size: clamp(3rem, 12vw, 10rem);
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      letter-spacing: 0.05em;
      margin-bottom: clamp(10px, 2vw, 20px);
      line-height: 1;
    }
    .timer-label {
      font-size: clamp(1rem, 2.5vw, 1.8rem);
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: clamp(15px, 3vw, 30px);
      font-weight: 500;
    }
    .controls {
      display: flex;
      gap: clamp(8px, 1.5vw, 15px);
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      background: white;
      color: #667eea;
      border: none;
      padding: clamp(10px, 1.5vw, 15px) clamp(20px, 3vw, 35px);
      border-radius: clamp(8px, 1.5vw, 12px);
      font-size: clamp(0.9rem, 1.8vw, 1.2rem);
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s, opacity 0.2s;
      white-space: nowrap;
    }
    .btn:hover {
      transform: translateY(-2px);
    }
    .btn:active {
      transform: translateY(0);
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-danger {
      background: #ef4444;
      color: white;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .warning {
      color: #fbbf24 !important;
      animation: pulse 1s ease-in-out infinite;
    }
    .progress-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      max-width: min(80vw, 80vh);
      max-height: min(80vw, 80vh);
    }
    .progress-ring circle {
      fill: none;
      stroke: rgba(255, 255, 255, 0.2);
      stroke-width: clamp(4, 1vw, 8);
    }
    .progress-ring .progress {
      stroke: white;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s linear;
    }
    @media (max-width: 600px) {
      .timer-display {
        font-size: clamp(2rem, 15vw, 4rem);
      }
      .btn {
        font-size: clamp(0.8rem, 2.5vw, 1rem);
        padding: clamp(8px, 2vw, 12px) clamp(15px, 4vw, 25px);
      }
    }
  </style>
</head>
<body>
  <div class="timer-wrapper">
    <svg class="progress-ring" viewBox="0 0 400 400">
      <circle cx="200" cy="200" r="180" />
      <circle class="progress" id="progress" cx="200" cy="200" r="180" 
              stroke-dasharray="1130.97" stroke-dashoffset="1130.97" />
    </svg>
    <div class="timer-container">
      <div class="timer-display" id="display">${formatTime(timerTime)}</div>
      <div class="timer-label" id="label">Timer Running</div>
      <div class="controls">
        <button class="btn" id="pauseBtn" onclick="toggleTimer()">⏸ Pause</button>
        <button class="btn btn-danger" onclick="resetTimer()">↻ Reset</button>
      </div>
    </div>
  </div>
  <script>
    let currentTime=${timerTime};
    const initialTime=${timerTime};
    let running=true;
    let interval=null;
    let startTime=Date.now();
    let pauseDuration=0;
    let lastPauseTime=0;
    const circumference=1130.97;
    
    function playSound(){
      try{
        const audioContext=new(window.AudioContext||window.webkitAudioContext)();
        const oscillator=audioContext.createOscillator();
        const gainNode=audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value=800;
        oscillator.type='sine';
        gainNode.gain.setValueAtTime(0.3,audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01,audioContext.currentTime+0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime+0.5);
      }catch(e){
        console.log('Audio not available');
      }
    }
    
    function updateProgress(){
      const progress=initialTime>0?((initialTime-currentTime)/initialTime):0;
      const offset=circumference*(1-progress);
      document.getElementById('progress').style.strokeDashoffset=offset;
    }
    
    function updateDisplay(){
      const display=document.getElementById('display');
      display.textContent=formatTime(currentTime);
      if(currentTime<=10&&currentTime>0&&running){
        display.classList.add('warning');
      }else{
        display.classList.remove('warning');
      }
      updateProgress();
    }
    
    function getElapsedTime(){
      if(!running)return 0;
      const now=Date.now();
      const elapsed=(now-startTime-pauseDuration)/1000;
      return Math.floor(elapsed);
    }
    
    function startTimer(){
      if(interval)return;
      running=true;
      if(lastPauseTime>0){
        pauseDuration+=(Date.now()-lastPauseTime);
        lastPauseTime=0;
      }else{
        startTime=Date.now();
        pauseDuration=0;
      }
      document.getElementById('label').textContent='Timer Running';
      document.getElementById('pauseBtn').textContent='⏸ Pause';
      interval=setInterval(()=>{
        const elapsed=getElapsedTime();
        currentTime=Math.max(0,initialTime-elapsed);
        updateDisplay();
        if(currentTime===0){
          running=false;
          clearInterval(interval);
          interval=null;
          document.getElementById('label').textContent="Time's Up! 🎉";
          document.getElementById('pauseBtn').textContent='▶ Start';
          playSound();
        }
      },100);
    }
    
    function toggleTimer(){
      if(running){
        lastPauseTime=Date.now();
        running=false;
        document.getElementById('label').textContent='Timer Paused';
        document.getElementById('pauseBtn').textContent='▶ Resume';
      }else{
        if(currentTime>0){
          startTimer();
        }
      }
    }
    
    function resetTimer(){
      running=false;
      lastPauseTime=0;
      pauseDuration=0;
      startTime=Date.now();
      if(interval){
        clearInterval(interval);
        interval=null;
      }
      currentTime=initialTime;
      updateDisplay();
      document.getElementById('label').textContent='Timer Reset';
      document.getElementById('pauseBtn').textContent='▶ Start';
    }
    
    function formatTime(seconds){
      const hours=Math.floor(seconds/3600);
      const mins=Math.floor((seconds%3600)/60);
      const secs=seconds%60;
      if(hours>0){
        return hours.toString().padStart(2,'0')+':'+mins.toString().padStart(2,'0')+':'+secs.toString().padStart(2,'0');
      }
      return mins.toString().padStart(2,'0')+':'+secs.toString().padStart(2,'0');
    }
    
    updateDisplay();
    startTimer();
  </script>
</body>
</html>`);
      newWindow.document.close();
      
      // Check if window is closed
      const checkWindowClosed = setInterval(() => {
        if (newWindow.closed) {
          setTimerWindow(null);
          clearInterval(checkWindowClosed);
        }
      }, 1000);
    }
  };

  const isWindowOpen = timerWindow && !timerWindow.closed;

  return (
    <Card className={cn("relative overflow-hidden border-0 shadow-xl", className)}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50" />
      
      {/* Frosted Glass Effect Card */}
      <div className="relative backdrop-blur-sm bg-white/40 p-4 rounded-xl border border-white/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-base text-gray-800">Timer</h3>
          </div>
        </div>

        {!isWindowOpen ? (
          <>

            {/* Timer Display */}
            <div className="relative mb-3">
              <div className="relative flex items-center justify-center py-8">
                <div className="text-5xl font-bold tracking-tight text-gray-800">
                  {formatTime(timerTime)}
                </div>
              </div>
            </div>

            {/* Quick Time Adjustments */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-white/60 hover:bg-white/80 shadow-sm"
                onClick={() => adjustTime(-60)}
                disabled={timerTime === 0}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-xs font-medium text-gray-600 w-14 text-center">
                1 min
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-white/60 hover:bg-white/80 shadow-sm"
                onClick={() => adjustTime(60)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {presets.map((preset) => (
                <Button
                  key={preset.seconds}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-lg font-medium transition-all duration-200 text-xs h-8",
                    "bg-white/60 hover:bg-white/80 shadow-sm",
                    timerTime === preset.seconds && "bg-blue-100 text-blue-700 hover:bg-blue-100"
                  )}
                  onClick={() => setPresetTime(preset.seconds)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Start Button */}
            <Button
              onClick={startTimerInWindow}
              disabled={timerTime === 0}
              className={cn(
                "w-full rounded-lg font-semibold shadow-lg transition-all duration-200 h-9",
                "bg-gradient-to-r from-green-500 to-emerald-500",
                "hover:from-green-600 hover:to-emerald-600",
                "text-white text-sm"
              )}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Timer
            </Button>

            {/* Status Text */}
            <div className="mt-2 text-center">
              <p className="text-xs font-medium text-gray-600">
                {timerTime === 0 ? "Set a time to begin" : "Ready to start"}
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Timer is running in window */}
            <div className="py-8 text-center">
              <div className="mb-3">
                <ExternalLink className="w-12 h-12 mx-auto text-green-500 mb-2" />
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-1">
                Timer Running
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                Running in separate window
              </p>
              <div className="text-2xl font-bold text-green-600 mb-4">
                {formatTime(timerTime)}
              </div>
              <Button
                onClick={() => {
                  if (timerWindow && !timerWindow.closed) {
                    timerWindow.focus();
                  }
                }}
                variant="outline"
                size="sm"
                className="rounded-lg bg-white/60 hover:bg-white/80 text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1.5" />
                Focus Window
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}


