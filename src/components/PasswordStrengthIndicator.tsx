import { Check, X } from 'lucide-react';
import { PasswordStrength } from '@/lib/passwordValidation';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
  showRequirements?: boolean;
}

export const PasswordStrengthIndicator = ({ 
  strength, 
  showRequirements = true 
}: PasswordStrengthIndicatorProps) => {
  const getStrengthColor = (score: number) => {
    if (score === 0) return 'bg-destructive';
    if (score === 1) return 'bg-destructive';
    if (score === 2) return 'bg-amber-500';
    if (score === 3) return 'bg-accent';
    return 'bg-emerald-500';
  };

  const getStrengthTextColor = (score: number) => {
    if (score === 0) return 'text-destructive';
    if (score === 1) return 'text-destructive';
    if (score === 2) return 'text-amber-500';
    if (score === 3) return 'text-accent';
    return 'text-emerald-500';
  };

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex gap-1 h-1">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn(
                "flex-1 rounded-full transition-all duration-300",
                index <= strength.score 
                  ? getStrengthColor(strength.score)
                  : "bg-muted"
              )}
            />
          ))}
        </div>
        <div className={cn(
          "text-xs font-medium capitalize transition-colors",
          getStrengthTextColor(strength.score)
        )}>
          {strength.label}
        </div>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="space-y-1.5 text-xs">
          <RequirementItem 
            met={strength.checks.minLength} 
            text="At least 8 characters"
          />
          <RequirementItem 
            met={strength.checks.hasUppercase} 
            text="One uppercase letter"
          />
          <RequirementItem 
            met={strength.checks.hasLowercase} 
            text="One lowercase letter"
          />
          <RequirementItem 
            met={strength.checks.hasNumber} 
            text="One number"
          />
          <RequirementItem 
            met={strength.checks.hasSpecial} 
            text="One special character (!@#$%^&*)"
          />
          <RequirementItem 
            met={strength.checks.notCommon} 
            text="Not a common password"
          />
        </div>
      )}
    </div>
  );
};

interface RequirementItemProps {
  met: boolean;
  text: string;
}

const RequirementItem = ({ met, text }: RequirementItemProps) => (
  <div className="flex items-center gap-2">
    {met ? (
      <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
    ) : (
      <X className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
    )}
    <span className={cn(
      "transition-colors",
      met ? "text-foreground" : "text-muted-foreground"
    )}>
      {text}
    </span>
  </div>
);
