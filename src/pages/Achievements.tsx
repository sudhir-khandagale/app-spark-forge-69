import RoleBasedBottomNav from "@/components/RoleBasedBottomNav";
import { AchievementGrid } from "@/components/profile/AchievementGrid";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

const Achievements = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">{t('all_achievements')}</h1>
        </div>

        <AchievementGrid />
      </div>
      <RoleBasedBottomNav />
    </div>
  );
};

export default Achievements;
