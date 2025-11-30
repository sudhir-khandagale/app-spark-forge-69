import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import RoleBasedBottomNav from '@/components/RoleBasedBottomNav';
import { SEOHead } from '@/components/SEOHead';
import { useVendorPosts } from '@/hooks/useVendorPosts';
import { VendorPostCard } from '@/components/vendor/VendorPostCard';
import { CreatePostModal } from '@/components/vendor/CreatePostModal';
import { useUserRole } from '@/hooks/useUserRole';
import { Skeleton } from '@/components/ui/skeleton';

const VendorFeed = () => {
  const { role } = useUserRole();
  const { posts, loading, likePost, refreshPosts } = useVendorPosts();
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  const isVendor = role === 'vendor' || role === 'admin';

  return (
    <>
      <SEOHead
        title="Vendor Feed - Discover Local Stores"
        description="Explore posts from local vendors, see product showcases, and connect with your favorite stores"
      />

      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Vendor Feed
                </h1>
                <p className="text-sm text-muted-foreground">Discover amazing local stores</p>
              </div>
              {isVendor && (
                <Button onClick={() => setCreatePostOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Feed Content */}
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="showcase">Products</TabsTrigger>
              <TabsTrigger value="stories">Stories</TabsTrigger>
              <TabsTrigger value="success">Success</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-96 w-full" />
                ))
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <VendorPostCard
                    key={post.id}
                    post={post}
                    onLike={likePost}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="showcase" className="space-y-6">
              {posts
                .filter(p => p.post_type === 'product_showcase')
                .map((post) => (
                  <VendorPostCard key={post.id} post={post} onLike={likePost} />
                ))}
            </TabsContent>

            <TabsContent value="stories" className="space-y-6">
              {posts
                .filter(p => p.post_type === 'behind_scenes')
                .map((post) => (
                  <VendorPostCard key={post.id} post={post} onLike={likePost} />
                ))}
            </TabsContent>

            <TabsContent value="success" className="space-y-6">
              {posts
                .filter(p => p.post_type === 'success_story')
                .map((post) => (
                  <VendorPostCard key={post.id} post={post} onLike={likePost} />
                ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {isVendor && (
        <CreatePostModal
          open={createPostOpen}
          onOpenChange={setCreatePostOpen}
          storeId={selectedStoreId}
          onSuccess={refreshPosts}
        />
      )}

      <RoleBasedBottomNav />
    </>
  );
};

export default VendorFeed;
