-- Supabase Schema for BlinkSplit

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the splits table to store all session data as JSONB for fast hackathon iteration
CREATE TABLE IF NOT EXISTS public.splits (
  id TEXT PRIMARY KEY, -- We'll use the short string IDs from the app (e.g. random 16 chars)
  receipt JSONB NOT NULL DEFAULT '{}'::jsonb,
  people JSONB NOT NULL DEFAULT '[]'::jsonb,
  assignments JSONB NOT NULL DEFAULT '{}'::jsonb,
  blinks JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'assigning', -- 'assigning', 'generated', 'complete'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
-- For the hackathon demo, we allow anon usage since there's no auth yet.
ALTER TABLE public.splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON public.splits
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access"
  ON public.splits
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON public.splits
  FOR UPDATE
  TO public
  USING (true);
