import React from 'react';
import { UserStoryGroup } from '@/types';
import StoryListItem from './StoryListItem';

interface StoryListProps {
  userGroups: UserStoryGroup[];
  onUserGroupClick: (userId: string) => void;
}

const StoryList: React.FC<StoryListProps> = ({ userGroups, onUserGroupClick }) => {
  if (!userGroups || userGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-white p-4">
        <h2 className="text-2xl font-semibold mb-3">No Stories Yet</h2>
        <p className="text-gray-400">Check back later for new updates!</p>
      </div>
    );
  }

  return (
    <div className="story-list-container flex flex-col items-center justify-center h-full w-full p-4 sm:p-6">
      <div className="text-center mb-6 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Explore Stories
        </h1>
        <p className="text-sm sm:text-base text-gray-300 mt-2">
          Tap on a story to watch!
        </p>
      </div>
      
      <div className="flex overflow-x-auto pb-4 scrollbar-hide w-full max-w-4xl">
        <div className="flex flex-nowrap mx-auto px-2 sm:px-4">
          {userGroups.map((group) => (
            <StoryListItem 
              key={group.userId} 
              userStoryGroup={group}
              onClick={() => onUserGroupClick(group.userId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoryList;
