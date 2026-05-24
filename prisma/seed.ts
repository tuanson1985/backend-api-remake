import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const exists = await prisma.user.findFirst({
    where: { shopId: null, username: 'admin' },
  });

  if (exists) {
    console.log('✅ Admin user already exists, skipping.');
    return;
  }

  const password = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.create({
    data: {
      shopId: null,
      username: 'admin',
      email: 'admin@admin.com',
      password,
      isFirstLogin: false,
      status: 'ACTIVE',
      profile: {
        create: { firstName: 'System', lastName: 'Admin' },
      },
    },
  });

  console.log(`✅ Admin created: id=${admin.id}, username=admin, password=Admin@123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
