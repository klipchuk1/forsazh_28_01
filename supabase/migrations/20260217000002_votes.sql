-- Votes/likes table for crew fan voting
CREATE TABLE crew_votes (
  id         SERIAL PRIMARY KEY,
  crew_id    INTEGER NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  voter_id   TEXT NOT NULL,  -- fingerprint from localStorage
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (crew_id, voter_id)
);

-- Enable RLS
ALTER TABLE crew_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read vote counts
CREATE POLICY "Public can read votes" ON crew_votes
  FOR SELECT USING (true);

-- Anyone can insert their own vote (one per crew per voter)
CREATE POLICY "Anyone can vote" ON crew_votes
  FOR INSERT WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE crew_votes;
