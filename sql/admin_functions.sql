-- Admin Statistics SQL Function
-- This function bypasses RLS policies for admin statistics

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    total_users INT := 0;
    total_events INT := 0;
    pending_events INT := 0;
    active_events INT := 0;
    today_registrations INT := 0;
    today_events INT := 0;
    users_growth DECIMAL := 0;
    events_growth DECIMAL := 0;
    today_start TIMESTAMP;
    week_ago TIMESTAMP;
    users_last_week INT := 0;
    events_last_week INT := 0;
BEGIN
    -- Calculate date boundaries
    today_start := DATE_TRUNC('day', NOW());
    week_ago := today_start - INTERVAL '7 days';

    -- Get total users
    SELECT COUNT(*) INTO total_users FROM profiles;
    
    -- Get total events
    SELECT COUNT(*) INTO total_events FROM events;
    
    -- Get pending events
    SELECT COUNT(*) INTO pending_events FROM events WHERE status = 'draft';
    
    -- Get active events (published and in the future)
    SELECT COUNT(*) INTO active_events 
    FROM events 
    WHERE status = 'published' AND date_time > NOW();
    
    -- Get today's registrations
    SELECT COUNT(*) INTO today_registrations 
    FROM profiles 
    WHERE created_at >= today_start;
    
    -- Get today's events
    SELECT COUNT(*) INTO today_events 
    FROM events 
    WHERE created_at >= today_start;
    
    -- Get last week's users for growth calculation
    SELECT COUNT(*) INTO users_last_week 
    FROM profiles 
    WHERE created_at >= week_ago AND created_at < today_start;
    
    -- Get last week's events for growth calculation
    SELECT COUNT(*) INTO events_last_week 
    FROM events 
    WHERE created_at >= week_ago AND created_at < today_start;
    
    -- Calculate growth percentages
    IF users_last_week > 0 THEN
        users_growth := ((today_registrations - users_last_week)::DECIMAL / users_last_week) * 100;
    END IF;
    
    IF events_last_week > 0 THEN
        events_growth := ((today_events - events_last_week)::DECIMAL / events_last_week) * 100;
    END IF;

    -- Build result JSON
    result := json_build_object(
        'totalUsers', total_users,
        'totalEvents', total_events,
        'pendingEvents', pending_events,
        'activeEvents', active_events,
        'todayRegistrations', today_registrations,
        'todayEvents', today_events,
        'growthStats', json_build_object(
            'usersGrowth', users_growth,
            'eventsGrowth', events_growth
        )
    );

    RETURN result;
EXCEPTION WHEN OTHERS THEN
    -- Return empty stats on error
    RETURN json_build_object(
        'totalUsers', 0,
        'totalEvents', 0,  
        'pendingEvents', 0,
        'activeEvents', 0,
        'todayRegistrations', 0,
        'todayEvents', 0,
        'growthStats', json_build_object(
            'usersGrowth', 0,
            'eventsGrowth', 0
        )
    );
END;
$$;
