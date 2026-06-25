import { buildSeedStories } from '@/lib/seed';
import type { Story } from '@/types/domain';

/** História de exemplo (primeira semente) — fallback do player. */
export const mockStory: Story = buildSeedStories()[0];
