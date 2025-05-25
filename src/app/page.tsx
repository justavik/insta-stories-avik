'use client';

import { useEffect, useState, useMemo } from 'react';
import { Story, UserStoryGroup } from '@/types';
import StoryList from '@/components/StoryList';
import StoryViewer from '@/components/StoryViewer';

const VIEWED_STORIES_KEY = 'viewedStoryIds';

export default function HomePage() {
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentViewingUserStories, setCurrentViewingUserStories] = useState<Story[] | null>(null);
  const [currentStoryActualIndexInViewer, setCurrentStoryActualIndexInViewer] = useState<number>(0);

  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const storedViewedIds = localStorage.getItem(VIEWED_STORIES_KEY);
      return storedViewedIds ? new Set(JSON.parse(storedViewedIds)) : new Set();
    }
    return new Set();
  });

  useEffect(() => {
    async function fetchAllStoriesData() {
      try {
        const response = await fetch('/api/stories');
        if (!response.ok) {
          throw new Error('Failed to fetch stories');
        }
        const data: Story[] = await response.json();
        setAllStories(data);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAllStoriesData();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(VIEWED_STORIES_KEY, JSON.stringify(Array.from(viewedStoryIds)));
    }
  }, [viewedStoryIds]);

  const userStoryGroups: UserStoryGroup[] = useMemo(() => {
    if (!allStories.length) return [];
    const groups: Record<string, { userName: string; userAvatarUrl: string; stories: Story[] }> = {};
    allStories.forEach(story => {
      if (!groups[story.userId]) {
        groups[story.userId] = { userName: story.userName, userAvatarUrl: story.userAvatarUrl, stories: [] };
      }
      groups[story.userId].stories.push(story);
    });

    return Object.entries(groups).map(([userId, groupData]) => ({
      userId,
      userName: groupData.userName,
      userAvatarUrl: groupData.userAvatarUrl,
      stories: groupData.stories,
      hasUnviewed: groupData.stories.some(story => !viewedStoryIds.has(story.id)),
    }));
  }, [allStories, viewedStoryIds]);

  const updateViewedStories = (storyId: string) => {
    setViewedStoryIds(prev => {
      const newSet = new Set(prev);
      newSet.add(storyId);
      return newSet;
    });
  };

  const openStoryViewerForUser = (userId: string) => {
    const userGroup = userStoryGroups.find(group => group.userId === userId);
    if (userGroup && userGroup.stories.length > 0) {
      setCurrentViewingUserStories(userGroup.stories);
      const startIndex = 0; 
      
      setCurrentStoryActualIndexInViewer(startIndex);
      if (userGroup.stories[startIndex]) {
        updateViewedStories(userGroup.stories[startIndex].id);
      }
    }
  };

  const closeStoryViewer = () => {
    setCurrentViewingUserStories(null);
    setCurrentStoryActualIndexInViewer(0);
  };

  const handleViewerNavigation = (newStoryIndexInGroup: number) => {
    if (currentViewingUserStories && newStoryIndexInGroup >= 0 && newStoryIndexInGroup < currentViewingUserStories.length) {
      setCurrentStoryActualIndexInViewer(newStoryIndexInGroup);
      const currentStoryInViewer = currentViewingUserStories[newStoryIndexInGroup];
      if (currentStoryInViewer) {
        updateViewedStories(currentStoryInViewer.id);
      }
    } else if (currentViewingUserStories && newStoryIndexInGroup >= currentViewingUserStories.length) {
      
      handleNextUserGroup();
    } else {
      
      closeStoryViewer(); 
    }
  };

  const handleNextUserGroup = () => {
    if (!currentViewingUserStories) return;
    const currentUserId = currentViewingUserStories[0]?.userId; 
    if (!currentUserId) {
      closeStoryViewer();
      return;
    }

    const currentUserGroupIndex = userStoryGroups.findIndex(group => group.userId === currentUserId);
    
    if (currentUserGroupIndex !== -1 && currentUserGroupIndex < userStoryGroups.length - 1) {
      
      const nextUserGroup = userStoryGroups[currentUserGroupIndex + 1];
      openStoryViewerForUser(nextUserGroup.userId); 
    } else {
      
      closeStoryViewer();
    }
  };

  if (loading) {
    return <div className="container flex items-center justify-center text-white">Loading stories...</div>;
  }

  return (
    <main 
      className={`container ${currentViewingUserStories === null ? 'story-list-active-bg' : 'bg-black'}`}
    >
      {currentViewingUserStories === null ? (
        <StoryList 
          userGroups={userStoryGroups}
          onUserGroupClick={openStoryViewerForUser}
        />
      ) : (
        <StoryViewer
          stories={currentViewingUserStories}
          startIndex={currentStoryActualIndexInViewer}
          onClose={closeStoryViewer}
          onNavigate={handleViewerNavigation}
        />
      )}
    </main>
  );
}
