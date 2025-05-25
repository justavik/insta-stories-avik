import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { Story } from '@/types';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'stories.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const stories: Story[] = JSON.parse(jsonData);
    
    const processedStories = stories.map(story => {
      if (story.type === 'image' && !story.duration) {
        return { ...story, duration: 5000 }; // Default 5 seconds for images
      }
      return story;
    });

    return NextResponse.json(processedStories);
  } catch (error) {
    console.error('Error reading stories data:', error);
    return NextResponse.json({ message: 'Error fetching stories' }, { status: 500 });
  }
} 