CREATE TABLE public.shared_state (
  key text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.shared_state TO anon, authenticated;
GRANT ALL ON public.shared_state TO service_role;
ALTER TABLE public.shared_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read shared state" ON public.shared_state FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert shared state" ON public.shared_state FOR INSERT TO anon, authenticated WITH CHECK (key IN ('passport','drying-beds'));
CREATE POLICY "update shared state" ON public.shared_state FOR UPDATE TO anon, authenticated USING (key IN ('passport','drying-beds')) WITH CHECK (key IN ('passport','drying-beds'));

CREATE TABLE public.drying_events (
  id text PRIMARY KEY,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.drying_events TO anon, authenticated;
GRANT ALL ON public.drying_events TO service_role;
ALTER TABLE public.drying_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read drying events" ON public.drying_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "append drying events" ON public.drying_events FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "read photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'photos');
CREATE POLICY "upload photos" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'photos');