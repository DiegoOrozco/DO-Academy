#!/bin/bash
PROJECT_DIR="/Users/diegorozco/Documents/web-site/stitch/course-platform"
cd "$PROJECT_DIR"
echo "--- NEW DEPLOYMENT START: $(date) ---" > push_result.log
git add src/actions/attendance.ts prisma/schema.prisma src/actions/admin-grading.ts src/app/api/grade-submission/route.ts src/components/DayDelivery.tsx src/app/admin/\(portal\)/courses/\[courseId\]/submissions/\[dayId\]/DaySubmissionsClient.tsx >> push_result.log 2>&1
git commit -m "fix: logic for attendance check-in and production sync" >> push_result.log 2>&1
git push origin dev >> push_result.log 2>&1
git push origin dev:main --force >> push_result.log 2>&1
echo "--- DEPLOYMENT END: $(date) ---" >> push_result.log
