import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface Challenge {
  id: string;
  name: string;
  description: string;
  challenge_type: string;
  requirement_value: number;
  reward_type: string;
  reward_value: any;
  icon: string;
}

interface ChallengeProgress {
  challenge_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  reward_claimed: boolean;
  challenge: Challenge;
}

export default function VendorChallenges({ storeId }: { storeId: string }) {
  const [challenges, setChallenges] = useState<ChallengeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, [storeId]);

  const fetchChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all active challenges
      const { data: allChallenges } = await supabase
        .from('vendor_challenges')
        .select('*')
        .eq('active', true);

      // Get user's progress
      const { data: userProgress } = await supabase
        .from('vendor_challenge_progress')
        .select('*')
        .eq('vendor_id', user.id)
        .eq('store_id', storeId);

      // Combine data
      const combined = (allChallenges || []).map(challenge => {
        const progress = userProgress?.find(p => p.challenge_id === challenge.id);
        return {
          challenge_id: challenge.id,
          progress: progress?.progress || 0,
          completed: progress?.completed || false,
          completed_at: progress?.completed_at || null,
          reward_claimed: progress?.reward_claimed || false,
          challenge: challenge as Challenge,
        };
      });

      setChallenges(combined);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('vendor_challenge_progress')
        .update({ reward_claimed: true })
        .eq('vendor_id', user.id)
        .eq('challenge_id', challengeId);

      if (error) throw error;

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      fetchChallenges();
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading challenges...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Active Challenges
        </CardTitle>
        <CardDescription>Complete challenges to earn rewards</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No active challenges at the moment
          </div>
        ) : (
          challenges.map((item) => {
            const progressPercent = Math.min((item.progress / item.challenge.requirement_value) * 100, 100);
            const isCompleted = item.completed;
            const canClaim = isCompleted && !item.reward_claimed;

            return (
              <div key={item.challenge_id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{item.challenge.name}</h4>
                      {isCompleted && (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.challenge.description}</p>
                  </div>
                  <Trophy className={`h-6 w-6 ${isCompleted ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Progress: {item.progress} / {item.challenge.requirement_value}
                    </span>
                    <span className="font-semibold">{progressPercent.toFixed(0)}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>

                {canClaim && (
                  <Button 
                    onClick={() => claimReward(item.challenge_id)}
                    className="w-full"
                  >
                    Claim Reward
                  </Button>
                )}

                {item.reward_claimed && (
                  <div className="text-center text-sm text-muted-foreground">
                    ✓ Reward claimed
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
