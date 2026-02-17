-- Enable Realtime for crew tables
ALTER PUBLICATION supabase_realtime ADD TABLE crews;
ALTER PUBLICATION supabase_realtime ADD TABLE crew_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE crew_segment_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE weekly_history;
