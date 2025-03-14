export const getLevelFromXP = (xp: number): number => {
  return Math.floor(xp / 100);
};

export const getXPForNextLevel = (currentXP: number): number => {
  const currentLevel = getLevelFromXP(currentXP);
  return (currentLevel + 1) * 100;
};

export const getXPProgress = (currentXP: number): number => {
  const currentLevel = getLevelFromXP(currentXP);
  const currentLevelXP = currentLevel * 100;
  const nextLevelXP = (currentLevel + 1) * 100;
  const progress = ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return Math.min(100, Math.max(0, progress));
};

export const getUserTitle = (level: number): string => {
  if (level >= 50) return 'Grandmaster';
  if (level >= 40) return 'Platinum';
  if (level >= 30) return 'Diamond';
  if (level >= 20) return 'Gold';
  if (level >= 10) return 'Silver';
  return 'Bronze';
};

export const getTitleColor = (title: string): string => {
  switch (title) {
    case 'Grandmaster':
      return 'text-yellow-400';
    case 'Platinum':
      return 'text-gray-300';
    case 'Diamond':
      return 'text-blue-400';
    case 'Gold':
      return 'text-yellow-500';
    case 'Silver':
      return 'text-gray-400';
    case 'Bronze':
      return 'text-amber-700';
    default:
      return 'text-gray-500';
  }
}; 