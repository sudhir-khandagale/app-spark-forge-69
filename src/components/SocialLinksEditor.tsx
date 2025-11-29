import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Twitter, Linkedin, Instagram, Github, Globe, Loader2 } from 'lucide-react';

interface SocialLinksEditorProps {
  userId: string;
  currentLinks?: Record<string, string>;
  onUpdate: (links: Record<string, string>) => void;
}

export const SocialLinksEditor = ({ userId, currentLinks = {}, onUpdate }: SocialLinksEditorProps) => {
  const [links, setLinks] = useState({
    twitter: currentLinks.twitter || '',
    linkedin: currentLinks.linkedin || '',
    instagram: currentLinks.instagram || '',
    github: currentLinks.github || '',
    website: currentLinks.website || '',
  });
  const [saving, setSaving] = useState(false);

  const socialPlatforms = [
    { key: 'twitter', label: 'Twitter/X', icon: Twitter, placeholder: 'https://twitter.com/username' },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/username' },
    { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
    { key: 'github', label: 'GitHub', icon: Github, placeholder: 'https://github.com/username' },
    { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yourwebsite.com' },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      // Filter out empty links
      const filteredLinks = Object.entries(links).reduce((acc, [key, value]) => {
        if (value.trim()) {
          acc[key] = value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      const { error } = await supabase
        .from('profiles')
        .update({ social_links: filteredLinks })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Social links updated successfully',
      });

      onUpdate(filteredLinks);
    } catch (error: any) {
      console.error('Error updating social links:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update social links',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Links</CardTitle>
        <CardDescription>
          Connect your social media profiles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {socialPlatforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <div key={platform.key} className="space-y-2">
              <Label htmlFor={platform.key} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {platform.label}
              </Label>
              <Input
                id={platform.key}
                type="url"
                placeholder={platform.placeholder}
                value={links[platform.key as keyof typeof links]}
                onChange={(e) => setLinks({ ...links, [platform.key]: e.target.value })}
              />
            </div>
          );
        })}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Social Links'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
