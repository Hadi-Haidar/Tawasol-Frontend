import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Trash2, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const VoiceMessage = ({ 
  src, 
  message, 
  isOwn = false, 
  duration: initialDuration = null,
  onDelete = null,
  canDelete = false,
  className = "",
  timestamp = null 
}) => {
  const { user } = useAuth();
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);


  // Format time in MM:SS format
  const formatTime = (time) => {
    if (isNaN(time) || time === 0 || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Toggle play/pause
  const togglePlayPause = async () => {
    if (!audioRef.current || hasError || isLoading) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Pause all other audio elements in the page
        const allAudio = document.querySelectorAll('audio');
        allAudio.forEach(audio => {
          if (audio !== audioRef.current && !audio.paused) {
            audio.pause();
          }
        });
        
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Audio play failed:', error);
      setHasError(true);
    }
  };

  // Handle progress bar click
  const handleProgressClick = (e) => {
    if (!audioRef.current || !progressRef.current || hasError || duration === 0) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(percent * duration, duration));
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle delete - directly call parent delete function
  const handleDeleteClick = () => {
    if (!canDelete || !onDelete) return;
    onDelete();
  };

  // Download voice message
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `voice-message-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (!initialDuration) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    const handleError = (e) => {
      console.error('Voice message error:', e);
      setHasError(true);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [initialDuration]);

  // Calculate progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Generate animated waveform bars
  const generateWaveform = (count = 20) => {
    return Array.from({ length: count }, (_, index) => {
      const baseHeight = 8 + (Math.sin((index * Math.PI) / count) * 8);
      const randomVariation = Math.random() * 4;
      return Math.max(4, Math.min(16, baseHeight + randomVariation));
    });
  };

  const waveformBars = generateWaveform();

  // Error state
  if (hasError) {
    return (
      <div className={`max-w-xs ${isOwn ? 'ml-auto' : 'mr-auto'} ${className}`}>
        <div className={`p-3 rounded-2xl ${
          isOwn 
            ? 'bg-red-500 text-white' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        }`}>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-200 dark:bg-red-800 rounded-full flex items-center justify-center">
              <Pause className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Voice message unavailable</p>
              <p className="text-xs opacity-80">Failed to load</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-[250px] ${isOwn ? 'ml-auto' : 'mr-auto'} ${className}`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="hidden"
      />

      {/* Voice message container */}
      <div className={`relative p-2.5 rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
        isOwn 
          ? 'bg-blue-500 text-white border-blue-600' 
          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600'
      }`}>
        
        {/* Main voice message content */}
        <div className="flex items-center space-x-2.5">
          
          {/* Play/Pause button */}
          <button
            onClick={togglePlayPause}
            disabled={isLoading || hasError}
            className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              isOwn
                ? 'bg-white/20 hover:bg-white/30 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 ml-0.5" />
            )}
          </button>

          {/* Waveform and progress */}
          <div className="flex-1 min-w-0">
            
            {/* Waveform visualization */}
            <div className="relative mb-1.5">
              <div 
                ref={progressRef}
                className="flex items-center space-x-0.5 h-4 cursor-pointer"
                onClick={handleProgressClick}
              >
                {waveformBars.slice(0, 15).map((height, index) => (
                  <div
                    key={index}
                    className={`w-0.5 rounded-full transition-all duration-150 ${
                      (index / 15) * 100 <= progressPercent
                        ? isOwn 
                          ? 'bg-white' 
                          : 'bg-blue-500'
                        : isOwn 
                          ? 'bg-white/40' 
                          : 'bg-gray-300 dark:bg-gray-500'
                    } ${isPlaying && (index / 15) * 100 <= progressPercent ? 'animate-pulse' : ''}`}
                    style={{ 
                      height: `${Math.min(height * 0.8, 12)}px`,
                      animationDelay: `${index * 50}ms`
                    }}
                  />
                ))}
              </div>
              
              {/* Progress overlay (invisible but clickable) */}
              <div 
                className="absolute inset-0 cursor-pointer"
                onClick={handleProgressClick}
                aria-label="Seek audio"
              />
            </div>

            {/* Time display */}
            <div className={`text-xs font-mono ${
              isOwn ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-0.5">
            
            {/* Download button */}
            <button
              onClick={handleDownload}
              className={`p-1 rounded-full transition-all duration-200 hover:scale-105 ${
                isOwn
                  ? 'hover:bg-white/20 text-white/70 hover:text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Download voice message"
              aria-label="Download"
            >
              <Download className="w-3 h-3" />
            </button>

            {/* Delete button (only for message owner) */}
            {canDelete && (
              <button
                onClick={handleDeleteClick}
                className={`p-1 rounded-full transition-all duration-200 hover:scale-105 ${
                  isOwn
                    ? 'hover:bg-red-500/20 text-white/70 hover:text-red-200'
                    : 'hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 dark:hover:text-red-400'
                }`}
                title="Delete voice message"
                aria-label="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Optional text message */}
        {message && (
          <div className={`mt-2 pt-2 border-t ${
            isOwn 
              ? 'border-white/20 text-white/90' 
              : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
          }`}>
            <p className="text-xs">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceMessage; 