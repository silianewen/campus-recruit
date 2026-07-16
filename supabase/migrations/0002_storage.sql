-- 0002_storage.sql — Supabase Storage bucket for resume files
-- Run AFTER 0001_init.sql.

-- Public bucket: files are readable via public URL (convenient for HR preview).
-- Upload is also public for MVP. Re-lock when auth is added.
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies first (idempotent re-runs)
DROP POLICY IF EXISTS "public upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "public read resumes"   ON storage.objects;

-- Allow anyone (anon role) to upload to the resumes bucket
CREATE POLICY "public upload resumes"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'resumes');

-- Allow anyone to read files in the resumes bucket
CREATE POLICY "public read resumes"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'resumes');