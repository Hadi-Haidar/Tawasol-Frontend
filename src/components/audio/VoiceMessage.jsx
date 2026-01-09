import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Trash2, Download, Mic } from 'lucide-react';
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
  const [showActions, setShowActions] = useState(false);

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

  const handleDeleteClick = () => {
    if (!canDelete || !onDelete) return;
    onDelete();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `voice-message-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (!initialDuration) setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const handleError = () => { setHasError(true); setIsLoading(false); };
    const handleCanPlay = () => setIsLoading(false);

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

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Generate waveform bars
  const [waveformBars] = useState(() =>
    Array.from({ length: 32 }, (_, i) => {
      const pos = i / 32;
      const wave = Math.sin(pos * Math.PI * 3) * 0.3 + Math.sin(pos * Math.PI * 5) * 0.2;
      return Math.max(0.2, Math.min(1, 0.4 + wave + Math.random() * 0.25));
    })
  );

  if (hasError) {
    return (
      <div className={`max-w-[260px] ${isOwn ? 'ml-auto' : 'mr-auto'} ${className}`}>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl ${isOwn ? 'bg-red-500 text-white' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          }`}>
          <Mic className="w-4 h-4 opacity-70" />
          <span className="text-xs">Voice unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`max-w-[280px] sm:max-w-[300px] ${isOwn ? 'ml-auto' : 'mr-auto'} ${className}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onTouchStart={() => setShowActions(true)}
    >
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      {/* Compact voice message - Single row design */}
      <div className={`relative flex items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-full transition-all duration-200 ${isOwn
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm'
        } ${isPlaying ? 'ring-2 ring-offset-1 ' + (isOwn ? 'ring-blue-300' : 'ring-green-400') : ''}`}>

        {/* Play/Pause button - Compact */}
        <button
          onClick={togglePlayPause}
          disabled={isLoading || hasError}
          className={`relative flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-50 ${isOwn
              ? 'bg-white/20 hover:bg-white/30 text-white'
              : 'bg-gradient-to-br from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white shadow-sm'
            }`}
        >
          {isPlaying && (
            <span className="absolute inset-0 rounded-full bg-current opacity-20 animate-ping" />
          )}
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 relative z-10" />
          ) : (
            <Play className="w-4 h-4 ml-0.5 relative z-10" />
          )}
        </button>

        {/* Waveform + Time - Compact layout */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          {/* Waveform */}
          <div
            ref={progressRef}
            className="relative h-5 sm:h-6 flex items-center cursor-pointer"
            onClick={handleProgressClick}
          >
            <div className="flex items-center gap-px w-full h-full">
              {waveformBars.map((height, index) => {
                const isActive = (index / waveformBars.length) * 100 <= progressPercent;
                return (
                  <div
                    key={index}
                    className={`flex-1 max-w-[3px] rounded-full transition-colors duration-100 ${isActive
                        ? isOwn ? 'bg-white' : 'bg-green-500'
                        : isOwn ? 'bg-white/35' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    style={{
                      height: `${height * 100}%`,
                      minHeight: '3px'
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Time display - Inline */}
          <div className={`flex items-center text-[10px] sm:text-[11px] tabular-nums ${isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
            }`}>
            <span>{formatTime(currentTime)}</span>
            <span className="mx-1 opacity-50">/</span>
            <span className="opacity-70">{formatTime(duration)}</span>

            {/* Mic icon */}
            <Mic className={`w-2.5 h-2.5 ml-1.5 ${isOwn ? 'text-white/50' : 'text-gray-400'}`} />
          </div>
        </div>

        {/* Action buttons - Compact */}
        <div className={`flex items-center gap-0.5 transition-opacity duration-200 ${showActions || canDelete ? 'opacity-100' : 'opacity-0 sm:opacity-100'
          }`}>
          <button
            onClick={handleDownload}
            className={`p-1.5 rounded-full transition-colors duration-150 ${isOwn
                ? 'hover:bg-white/20 text-white/60 hover:text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600'
              }`}
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {canDelete && (
            <button
              onClick={handleDeleteClick}
              className={`p-1.5 rounded-full transition-colors duration-150 ${isOwn
                  ? 'hover:bg-red-400/30 text-white/60 hover:text-red-200'
                  : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500'
                }`}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceMessage;