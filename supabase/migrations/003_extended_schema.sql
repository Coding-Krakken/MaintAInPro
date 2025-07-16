-- Create notifications table for real-time notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  entity_type VARCHAR(50), -- 'work_order', 'equipment', 'inventory', etc.
  entity_id UUID, -- ID of the related entity
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_logs table for comprehensive audit trail
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', etc.
  entity_type VARCHAR(50) NOT NULL, -- 'work_order', 'equipment', 'user', etc.
  entity_id UUID, -- ID of the affected entity
  old_values JSONB, -- Previous values for updates
  new_values JSONB, -- New values for creates/updates
  ip_address INET,
  user_agent TEXT,
  metadata JSONB, -- Additional context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_preferences table for personalized settings
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  dashboard_layout JSONB DEFAULT '{}',
  table_settings JSONB DEFAULT '{}', -- Column preferences, sorting, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create file_uploads table for attachment management
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50), -- 'work_order', 'equipment', 'preventive_maintenance', etc.
  entity_id UUID, -- ID of the related entity
  is_processed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}', -- Image dimensions, thumbnails, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create escalation_rules table for automated workflows
CREATE TABLE escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  entity_type VARCHAR(50) NOT NULL, -- 'work_order', 'preventive_maintenance', etc.
  conditions JSONB NOT NULL, -- Conditions that trigger escalation
  actions JSONB NOT NULL, -- Actions to take when escalated
  delay_hours INTEGER DEFAULT 24, -- How long to wait before escalating
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read_at ON notifications(read_at) WHERE read_at IS NULL;

CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_entity ON system_logs(entity_type, entity_id);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_action ON system_logs(action);

CREATE INDEX idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX idx_file_uploads_entity ON file_uploads(entity_type, entity_id);
CREATE INDEX idx_file_uploads_created_at ON file_uploads(created_at DESC);

CREATE INDEX idx_escalation_rules_entity_type ON escalation_rules(entity_type);
CREATE INDEX idx_escalation_rules_is_active ON escalation_rules(is_active) WHERE is_active = true;

-- Enable RLS on all tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System logs: Read-only for regular users, admins can see all
CREATE POLICY "Users can view logs for their actions" ON system_logs
  FOR SELECT USING (user_id = auth.uid() OR auth.jwt()->>'role' = 'admin');

CREATE POLICY "System can insert logs" ON system_logs
  FOR INSERT WITH CHECK (true);

-- User preferences: Users can only manage their own preferences
CREATE POLICY "Users can manage their own preferences" ON user_preferences
  FOR ALL USING (user_id = auth.uid());

-- File uploads: Users can see files they uploaded or are related to their work
CREATE POLICY "Users can view their uploaded files" ON file_uploads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can upload files" ON file_uploads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their uploaded files" ON file_uploads
  FOR UPDATE USING (user_id = auth.uid());

-- Escalation rules: Admins and managers can manage
CREATE POLICY "Admins can manage escalation rules" ON escalation_rules
  FOR ALL USING (auth.jwt()->>'role' IN ('admin', 'manager'));

CREATE POLICY "Users can view active escalation rules" ON escalation_rules
  FOR SELECT USING (is_active = true);

-- Create functions for automated actions

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log(
  p_action VARCHAR(100),
  p_entity_type VARCHAR(50),
  p_entity_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO system_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    metadata
  ) VALUES (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type VARCHAR(20) DEFAULT 'info',
  p_entity_type VARCHAR(50) DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    entity_type,
    entity_id
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_entity_type,
    p_entity_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET read_at = NOW() 
  WHERE id = notification_id AND user_id = auth.uid() AND read_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count() RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notifications
    WHERE user_id = auth.uid() AND read_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic audit logging

-- Trigger function for work orders
CREATE OR REPLACE FUNCTION work_order_audit_trigger() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log('work_order_created', 'work_order', NEW.id, NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_audit_log('work_order_updated', 'work_order', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_audit_log('work_order_deleted', 'work_order', OLD.id, to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to work_orders table
CREATE TRIGGER work_order_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION work_order_audit_trigger();

-- Create views for optimized reporting

-- View for work order statistics
CREATE OR REPLACE VIEW work_order_stats AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
  COUNT(*) FILTER (WHERE status = 'open') as open_orders,
  COUNT(*) FILTER (WHERE priority = 'high') as high_priority_orders,
  AVG(EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - created_at))/3600) as avg_completion_hours
FROM work_orders
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- View for equipment maintenance history
CREATE OR REPLACE VIEW equipment_maintenance_history AS
SELECT 
  e.id as equipment_id,
  e.name as equipment_name,
  e.type as equipment_type,
  COUNT(wo.id) as total_work_orders,
  COUNT(wo.id) FILTER (WHERE wo.status = 'completed') as completed_work_orders,
  MAX(wo.completed_at) as last_maintenance_date,
  AVG(EXTRACT(EPOCH FROM (wo.completed_at - wo.created_at))/3600) as avg_resolution_hours
FROM equipment e
LEFT JOIN work_orders wo ON e.id = wo.equipment_id
GROUP BY e.id, e.name, e.type;

-- Create materialized view for dashboard metrics (refresh periodically)
CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT 
  'work_orders' as metric_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'open') as open_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE priority = 'high' AND status NOT IN ('completed', 'closed')) as high_priority_open,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as created_this_week,
  COUNT(*) FILTER (WHERE completed_at >= NOW() - INTERVAL '7 days') as completed_this_week
FROM work_orders
UNION ALL
SELECT 
  'equipment' as metric_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'operational') as operational_count,
  COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_count,
  COUNT(*) FILTER (WHERE status = 'offline') as offline_count,
  0 as high_priority_open,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as created_this_week,
  0 as completed_this_week
FROM equipment;

-- Create index on materialized view
CREATE INDEX idx_dashboard_metrics_type ON dashboard_metrics(metric_type);

-- Function to refresh dashboard metrics
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics() RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW dashboard_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Real-time notifications for users';
COMMENT ON TABLE system_logs IS 'Comprehensive audit trail for all system actions';
COMMENT ON TABLE user_preferences IS 'User personalization settings';
COMMENT ON TABLE file_uploads IS 'File attachment management';
COMMENT ON TABLE escalation_rules IS 'Automated workflow escalation rules';

COMMENT ON FUNCTION create_audit_log IS 'Creates audit log entries for system actions';
COMMENT ON FUNCTION create_notification IS 'Creates notifications for users';
COMMENT ON FUNCTION mark_notification_read IS 'Marks a notification as read';
COMMENT ON FUNCTION get_unread_notification_count IS 'Returns count of unread notifications for current user';
COMMENT ON FUNCTION refresh_dashboard_metrics IS 'Refreshes the dashboard metrics materialized view';
