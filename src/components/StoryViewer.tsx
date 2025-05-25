'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Story } from '@/types';

interface StoryViewerProps {
  stories: Story[];
  startIndex: number;
  onClose: () => void;
  onNavigate: (newIndexInGroup: number) => void;
}

const STORY_IMAGE_DEFAULT_DURATION = 5000;

const StoryViewer: React.FC<StoryViewerProps> = ({ stories, startIndex, onClose, onNavigate }) => {
  const [currentIndexInGroup, setCurrentIndexInGroup] = useState(startIndex);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const currentStory = stories[currentIndexInGroup];
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement | null>(null);
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const remainingDurationRef = useRef<number>(0);

  const clearTimers = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    advanceTimerRef.current = null;
    progressIntervalRef.current = null;
  }, []);

  const handleNextStoryInGroup = useCallback(() => {
    clearTimers();
    setIsLoadingMedia(true);
    setProgress(0);
    setVideoDuration(null);
    const nextIndex = currentIndexInGroup + 1;
    onNavigate(nextIndex);
  }, [currentIndexInGroup, onNavigate, clearTimers]);

  const handlePrevStoryInGroup = useCallback(() => {
    clearTimers();
    setIsLoadingMedia(true);
    setProgress(0);
    setVideoDuration(null);
    const prevIndex = currentIndexInGroup - 1;
    if (prevIndex >= 0) {
      onNavigate(prevIndex);
    } else {
      onClose();
    }
  }, [currentIndexInGroup, onNavigate, onClose, clearTimers]);

  useEffect(() => {
    setCurrentIndexInGroup(startIndex);
    setIsLoadingMedia(true);
    setProgress(0);
    setIsPaused(false);
    setVideoDuration(null);
    clearTimers();
  }, [startIndex, stories, clearTimers]);

  useEffect(() => {
    if (!currentStory || isLoadingMedia || isPaused) {
      if(!currentStory) {
        clearTimers();
        return;
      }
      return;
    }
    clearTimers();
    if (currentStory.type === 'image') {
      const duration = remainingDurationRef.current > 0 
        ? remainingDurationRef.current 
        : (currentStory.duration || STORY_IMAGE_DEFAULT_DURATION);
      remainingDurationRef.current = 0;
      advanceTimerRef.current = setTimeout(handleNextStoryInGroup, duration);
      const progressStartTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        const elapsedTime = Date.now() - progressStartTime;
        const currentProgress = (elapsedTime / duration) * 100;
        setProgress(Math.min(currentProgress, 100));
        if (currentProgress >= 100) clearInterval(progressIntervalRef.current!); 
      }, 50);
    } else if (currentStory.type === 'video' && mediaRef.current instanceof HTMLVideoElement) {
      const videoElement = mediaRef.current;
      if (videoElement.readyState >= videoElement.HAVE_METADATA && videoDuration) {
        videoElement.play().catch(err => console.error("Error resuming video play:", err));
      }
    }
    return () => clearTimers();
  }, [currentStory, isLoadingMedia, isPaused, handleNextStoryInGroup, clearTimers, videoDuration]);
  
  useEffect(() => {
    if (currentStory?.type === 'video' && mediaRef.current instanceof HTMLVideoElement) {
      const videoElement = mediaRef.current;
      const onLoadedMetadata = () => {
        if (!currentStory) return;
        setVideoDuration(videoElement.duration * 1000);
        if (!isPaused) videoElement.play().catch(err => console.error("Error auto playing video:", err));
      };
      const onTimeUpdate = () => { 
        if (!currentStory) return;
        if (videoElement.duration && !isPaused) setProgress((videoElement.currentTime / videoElement.duration) * 100); 
      };
      const onVideoEnded = () => { 
        if (!currentStory) return;
        if (!isPaused) handleNextStoryInGroup(); 
      };
      videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
      videoElement.addEventListener('timeupdate', onTimeUpdate);
      videoElement.addEventListener('ended', onVideoEnded);
      if (videoElement.currentSrc !== currentStory.url) videoElement.load();
      return () => {
        videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
        videoElement.removeEventListener('timeupdate', onTimeUpdate);
        videoElement.removeEventListener('ended', onVideoEnded);
      };
    }
  }, [currentStory, isPaused, handleNextStoryInGroup]);

  const handleMediaLoad = () => {
    setIsLoadingMedia(false);
    setProgress(0);
    setIsPaused(false);
    remainingDurationRef.current = 0;
  };

  const togglePause = (shouldPause: boolean) => {
    if (isLoadingMedia || !currentStory) return;
    setIsPaused(shouldPause);
    if (shouldPause) {
      clearTimers();
      if (currentStory.type === 'image') {
        const duration = currentStory.duration || STORY_IMAGE_DEFAULT_DURATION;
        const elapsedTime = (progress / 100) * duration;
        remainingDurationRef.current = duration - elapsedTime;
      }
      if (currentStory.type === 'video' && mediaRef.current instanceof HTMLVideoElement) mediaRef.current.pause();
    } 
  };

  if (!currentStory) return null;
  
  const onInteractionStart = () => togglePause(true);
  const onInteractionEnd = () => togglePause(false);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center select-none">
      <div className="absolute inset-0 z-10" onMouseDown={onInteractionStart} onMouseUp={onInteractionEnd} onTouchStart={onInteractionStart} onTouchEnd={onInteractionEnd}></div>

      <div className="relative w-full h-full max-w-screen-sm max-h-screen aspect-[9/16] flex items-center justify-center">
        {isLoadingMedia && <div className="absolute inset-0 flex items-center justify-center text-white z-30">Loading...</div>}
        {currentStory.type === 'image' ? (
          <Image key={currentStory.id} src={currentStory.url} alt={`Story by ${currentStory.userName}`} layout="fill" objectFit="contain" priority onLoad={handleMediaLoad} onError={() => setIsLoadingMedia(false)} className={`${isLoadingMedia ? 'opacity-0' : 'opacity-100'} ${isPaused ? 'opacity-70' : 'opacity-100'} transition-opacity duration-200 ease-in-out`} />
        ) : (
          <video key={currentStory.id} ref={mediaRef as React.Ref<HTMLVideoElement>} src={currentStory.url} playsInline muted onLoadedData={handleMediaLoad} onError={() => setIsLoadingMedia(false)} className={`w-full h-full object-contain ${isLoadingMedia ? 'opacity-0' : 'opacity-100'} ${isPaused ? 'opacity-70' : 'opacity-100'} transition-opacity duration-300 ease-in-out`} />
        )}
        {!isLoadingMedia && (
          <>
            <div className="absolute left-0 top-0 h-full w-1/3 cursor-pointer z-20" onClick={(e) => { e.stopPropagation(); handlePrevStoryInGroup(); }}/>
            <div className="absolute right-0 top-0 h-full w-1/3 cursor-pointer z-20" onClick={(e) => { e.stopPropagation(); handleNextStoryInGroup(); }}/>
          </>
        )}
      </div>

      <div className="absolute top-0 left-0 right-0 pt-3 pb-2 px-3 flex items-center justify-between z-30">
        <div className="flex flex-col w-full">
          <div className="flex items-center space-x-2 mb-1.5">
            <Image 
              src={currentStory.userAvatarUrl} 
              alt={`${currentStory.userName}'s avatar`}
              width={28} 
              height={28} 
              className="rounded-full border border-white/60 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/user-avatars/default.png'; }}
            />
            <span className="text-white font-semibold text-sm">{currentStory.userName}</span>
          </div>
          <div className="flex space-x-1 h-0.5 sm:h-1 w-full">
            {stories.map((story, index) => (
              <div key={story.id} className="flex-1 bg-white bg-opacity-40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-150 ease-linear"
                  style={{
                    width: `${index === currentIndexInGroup ? progress : (index < currentIndexInGroup ? 100 : 0)}%`,
                    backgroundColor: index === currentIndexInGroup ? '#FF0000' : 'rgba(255,255,255,0.8)'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-white text-2xl sm:text-3xl p-1 z-10 bg-transparent hover:bg-black/20 rounded-full w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center leading-none transition-colors self-start ml-2" aria-label="Close story viewer">
          &times;
        </button>
      </div>
    </div>
  );
};

export default StoryViewer;