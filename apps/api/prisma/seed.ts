import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 테스트 사용자 생성
  const passwordHash = await bcrypt.hash('test1234', 10);

  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash,
      nickname: '테스트 사용자',
      authProvider: 'email',
      emailVerified: true,
      isActive: true,
    },
  });

  console.log('✅ 테스트 사용자 생성 완료:', {
    email: testUser.email,
    nickname: testUser.nickname,
    password: 'test1234',
  });
}

main()
  .catch((e) => {
    console.error('❌ 시드 실행 중 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
