# 🚨 URGENT: Database Setup Required

## Current Issue
Your RaveTracker application is showing these errors:
```
relation "public.profiles" does not exist
Could not find a relationship between 'event_attendance' and 'events'
```

This means **the database tables haven't been created yet** in your Supabase project.

## ✅ Quick Fix (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your project: `njovoopqcfywrlhhndlb`

### Step 2: Run Database Setup
1. Click "SQL Editor" in the left sidebar
2. Click "New query"
3. Copy the entire contents of `database-setup.sql` (in this project folder)
4. Paste into the SQL Editor
5. Click "Run"

### Step 3: Verify Success
You should see: "🎉 RaveTracker v3.0 Database Setup Complete!"

### Step 4: Restart Application
```bash
# Stop the dev server (Ctrl+C)
# Then restart:
npm run dev
```

## What This Creates

The setup script creates all required database tables:

- **profiles** - User profile data
- **events** - Event information  
- **event_attendance** - Who's attending what events
- **event_categories** - Event types (Techno, House, etc.)
- **notifications** - User notifications

Plus all necessary:
- Foreign key relationships
- Security policies (RLS)
- Indexes for performance
- Sample event categories

## After Setup

Once complete, your application will:
- ✅ Load without console errors
- ✅ Allow user registration/login
- ✅ Support event creation and attendance
- ✅ Show proper navigation and user profiles

---

**Need help?** Check `DATABASE_SETUP.md` for detailed instructions.
