-- Grant authenticated role access to the exit ticket template tables
-- (RLS policies already restrict row-level access to the owning teacher)

GRANT ALL ON TABLE exit_ticket_templates TO authenticated;
GRANT ALL ON TABLE template_questions TO authenticated;
GRANT ALL ON TABLE template_question_options TO authenticated;
