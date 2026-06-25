import { buildSeedStories } from '@/lib/story/seed';
import type { Story } from '@/lib/story/types';

/** História de exemplo (primeira semente) — fallback do player. */
export const mockStory: Story = buildSeedStories()[0];
