import React, { useState } from 'react';
import { Wheel } from 'react-custom-roulette';
import { RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useClassroomTheme } from '@/contexts/ClassroomThemeContext';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

interface StudentSpinnerProps {
  students: Student[];
  onClose?: () => void;
}

export function StudentSpinner({ students, onClose }: StudentSpinnerProps) {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [winner, setWinner] = useState<Student | null>(null);
  const { currentTheme } = useClassroomTheme();

  // Transform students array to roulette data format
  const rouletteData = students.map((student) => ({
    option: `${student.first_name} ${student.last_name}`,
    id: student.id,
  }));

  const minimumOptions = 6;
  const dataWithPlaceholders = rouletteData.length < minimumOptions 
    ? [...rouletteData, ...Array(minimumOptions - rouletteData.length).fill({ option: '', id: 'placeholder' })]
    : rouletteData;

  const handleSpin = () => {
    if (students.length === 0) return;
    
    setWinner(null);
    const newPrizeNumber = Math.floor(Math.random() * students.length);
    setPrizeNumber(newPrizeNumber);
    setMustSpin(true);
  };

  const handleStopSpinning = () => {
    setMustSpin(false);
    if (students[prizeNumber]) {
      setWinner(students[prizeNumber]);
    }
  };

  const handleReset = () => {
    setWinner(null);
    setMustSpin(false);
    setPrizeNumber(0);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (window.opener) {
      window.close();
    }
  };

  if (students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">No students available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: currentTheme.gradient
        }}
      />

      {/* Close button */}
      {onClose || window.opener ? (
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      ) : null}

{/* Content */}
<div className="relative z-10 flex flex-col items-center justify-center w-full text-center">
  <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-2">
    Student Wheel
  </h2>
  <p className="text-white/80 mb-6 text-lg">
    Click to spin and select a random student
  </p>

  {/* Wheel */}
  <div className="roulette-container" style={{ textAlign: 'center' }}>
    <Wheel
      mustStartSpinning={mustSpin}
      prizeNumber={prizeNumber}
      data={dataWithPlaceholders}
      backgroundColors={[
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
        '#F1948A', '#82E0AA', '#F8C471', '#85C1E2'
      ]}
      textColors={['#ffffff']}
      fontSize={14}
      outerBorderColor="#ffffff"
      outerBorderWidth={10}
      innerRadius={10}
      innerBorderColor="#ffffff"
      innerBorderWidth={5}
      radiusLineColor="#ffffff"
      radiusLineWidth={2}
      perpendicularText={false}
      textDistance={70}
      spinDuration={0.3}
      onStopSpinning={handleStopSpinning}
    />
  </div>

  {/* Winner */}
  {winner && (
    <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 drop-shadow-lg">
      {winner.first_name} {winner.last_name}
    </p>
  )}

  {/* Controls */}
  <div className="flex gap-3 w-full max-w-md justify-center">
    <Button
      onClick={handleSpin}
      disabled={mustSpin}
      size="lg"
      className={cn(
        'flex-1 rounded-xl font-bold text-lg shadow-lg transition-all duration-200',
        'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600',
        'text-white py-5 md:py-6',
        mustSpin && 'opacity-50 cursor-not-allowed'
      )}
    >
      {mustSpin ? 'Spinning...' : '🎡 Spin the Wheel'}
    </Button>
    {winner && (
      <Button
        onClick={handleReset}
        variant="outline"
        size="lg"
        className="rounded-xl font-bold text-lg border-2 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white py-5 md:py-6"
      >
        <RotateCcw className="w-5 h-5 mr-2" />
        Reset
      </Button>
    )}
  </div>

  {/* Student Count */}
  <p className="mt-4 text-white/70 text-sm md:text-base">
    {students.length} {students.length === 1 ? 'student' : 'students'} in the wheel
  </p>
</div>
  </div>
);
}