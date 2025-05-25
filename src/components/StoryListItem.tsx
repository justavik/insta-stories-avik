import React from 'react';
import Image from 'next/image';
import { UserStoryGroup } from '@/types';

interface StoryListItemProps {
  userStoryGroup: UserStoryGroup;
  onClick: () => void;
}

const StoryListItem: React.FC<StoryListItemProps> = ({ userStoryGroup, onClick }) => {
  const { userName, userAvatarUrl, stories, hasUnviewed } = userStoryGroup;
  
  const previewStory = stories[0]; 
  if (!previewStory) return null; 

  const borderColor = hasUnviewed ? 'border-pink-500' : 'border-gray-500';

  return (
    <div 
      className="story-list-item cursor-pointer flex-shrink-0 transition-transform duration-200 ease-in-out hover:scale-105 m-2 group"
      onClick={onClick}
    >
      <div 
        className={`relative w-32 h-48 sm:w-36 sm:h-56 rounded-xl overflow-hidden border-2 ${borderColor} p-0.5 flex items-center justify-center shadow-lg bg-gray-700`}
      >
        
        {previewStory.type === 'image' ? (
          <Image 
            src={previewStory.url} 
            alt={`Preview of ${userName}'s story`}
            layout="fill"
            objectFit="cover"
            className="rounded-md"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.png'; }} 
          />
        ) : (
          <video 
            src={`${previewStory.url}#t=0.1`}
            muted
            preload="metadata"
            className="object-cover w-full h-full rounded-md"
            onLoadedMetadata={(e) => e.currentTarget.currentTime = 0.1 }
          >
            <Image src='/placeholder-video.jpeg' alt="Video placeholder" layout="fill" objectFit="cover" className="rounded-md"/>
          </video>
        )}

        
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
          <div className="flex items-center space-x-2">
            <Image 
              src={userAvatarUrl} 
              alt={`${userName}'s avatar`}
              width={24} 
              height={24} 
              className="rounded-full border border-white/50 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/user-avatars/default.png'; }} 
            />
            <p className="text-white text-xs font-semibold truncate">{userName}</p>
          </div>
        </div>
        
        
         <div className="absolute top-1.5 right-1.5 z-10">
            <Image 
              src={userAvatarUrl} 
              alt={``} 
              width={28} 
              height={28} 
              className="rounded-full border-2 border-white shadow-md object-cover group-hover:scale-110 transition-transform"
              onError={(e) => { (e.target as HTMLImageElement).src = '/user-avatars/default.png'; }} 
            />
        </div>
      </div>
    </div>
  );
};

export default StoryListItem; 