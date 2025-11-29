import { Progress } from "@/components/ui/progress";

interface LevelProgressProps {
  currentPoints: number;
  nextLevelPoints: number;
  level: number;
}

export const LevelProgress = ({ currentPoints, nextLevelPoints, level }: LevelProgressProps) => {
  const progress = Math.min((currentPoints / nextLevelPoints) * 100, 100);

  const getLevelGradient = (level: number) => {
    const gradients = {
      1: "from-blue-500 to-blue-600",
      2: "from-orange-500 to-orange-600",
      3: "from-gray-400 to-gray-500",
      4: "from-yellow-400 to-yellow-600",
      5: "from-purple-500 via-pink-500 to-purple-600"
    };
    return gradients[level as keyof typeof gradients] || "from-blue-500 to-blue-600";
  };

  return (
    <div className="relative">
      <Progress 
        value={progress} 
        className="h-3 bg-muted"
      />
      <div 
        className={`absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r ${getLevelGradient(level)} transition-all duration-500`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
