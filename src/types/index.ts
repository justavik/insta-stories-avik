export interface Story {
  id: string;
  type: 'image' | 'video';
  url: string;
  duration?: number;
  viewed?: boolean;

  userId: string;
  userName: string;
  userAvatarUrl: string;
}

export interface UserStoryGroup {
  userId: string;
  userName: string;
  userAvatarUrl: string;
  stories: Story[];
  hasUnviewed: boolean;
}