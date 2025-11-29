-- Add Storage RLS Policies for avatars bucket
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can upload their own avatar'
  ) THEN
    CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can update their own avatar'
  ) THEN
    CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can delete their own avatar'
  ) THEN
    CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Anyone can view avatars'
  ) THEN
    CREATE POLICY "Anyone can view avatars"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Add foreign key from user_points to profiles (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_points_user_id_fkey' 
    AND table_name = 'user_points'
  ) THEN
    ALTER TABLE public.user_points
    ADD CONSTRAINT user_points_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill missing user_levels records
INSERT INTO public.user_levels (user_id, level, level_name, current_points, next_level_points)
SELECT 
  p.id,
  1,
  'New Explorer',
  COALESCE(up.balance, 0),
  51
FROM public.profiles p
LEFT JOIN public.user_levels ul ON ul.user_id = p.id
LEFT JOIN public.user_points up ON up.user_id = p.id
WHERE ul.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Backfill missing user_statistics records
INSERT INTO public.user_statistics (user_id, join_date)
SELECT p.id, p.created_at
FROM public.profiles p
LEFT JOIN public.user_statistics us ON us.user_id = p.id
WHERE us.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Backfill missing user_preferences records
INSERT INTO public.user_preferences (user_id)
SELECT p.id
FROM public.profiles p
LEFT JOIN public.user_preferences up ON up.user_id = p.id
WHERE up.id IS NULL
ON CONFLICT (user_id) DO NOTHING;