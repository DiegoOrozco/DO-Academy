import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('--- Database Cleanup Started ---')

    try {
        // 1. Clear Forum Interactions
        const repliesCount = await prisma.reply.deleteMany({})
        console.log(`- Deleted ${repliesCount.count} forum replies`)

        const postsCount = await prisma.post.deleteMany({})
        console.log(`- Deleted ${postsCount.count} forum posts`)

        // 2. Clear Course Submissions
        const submissionsCount = await prisma.submission.deleteMany({})
        console.log(`- Deleted ${submissionsCount.count} exercise/assignment submissions`)

        // 3. Clear Video Progress
        const progressCount = await prisma.videoProgress.deleteMany({})
        console.log(`- Deleted ${progressCount.count} video progress records`)

        // 4. Clear Student Enrollments
        const enrollmentCount = await prisma.enrollment.deleteMany({})
        console.log(`- Deleted ${enrollmentCount.count} student enrollments`)

        // 5. Delete Students
        const studentsCount = await prisma.user.deleteMany({
            where: { role: 'STUDENT' }
        })
        console.log(`- Deleted ${studentsCount.count} student accounts`)

        console.log('--- Database Cleanup Completed Successfully ---')
    } catch (error) {
        console.error('Error during cleanup:', error)
    } finally {
        await prisma.$disconnect()
        await pool.end()
    }
}

main()
