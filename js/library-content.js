import { stories } from './data.js';

export async function readLibraryStory(id, fetcher = fetch) {
  const story = stories.find(item => item.id === id);
  if (!story) throw new Error('Unknown library story');
  const response = await fetcher(story.path);
  if (!response.ok) throw new Error('Library story unavailable');
  return response.text();
}
