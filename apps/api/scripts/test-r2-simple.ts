import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

async function testR2Simple() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  console.log('🔍 Configuration:');
  console.log(`Account ID: ${accountId}`);
  console.log(`Bucket Name: "${bucketName}"`);
  console.log(`Public URL: ${publicUrl}`);
  console.log(`Access Key: ${accessKeyId?.substring(0, 10)}...`);

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId || '',
      secretAccessKey: secretAccessKey || '',
    },
  });

  // 여러 버킷 이름 시도
  const possibleNames = [
    bucketName || '',
    'travel-pannel',
    'travel-planner',
    'travelpannel',
    'travelplanner',
  ];

  for (const name of possibleNames) {
    try {
      console.log(`\n📤 Trying bucket: "${name}"`);

      const testKey = `test/test-${Date.now()}.txt`;
      const putCommand = new PutObjectCommand({
        Bucket: name,
        Key: testKey,
        Body: Buffer.from('Test content', 'utf-8'),
        ContentType: 'text/plain',
      });

      await s3Client.send(putCommand);
      console.log(`✅ SUCCESS! Found bucket: "${name}"`);
      console.log(`   Uploaded: ${testKey}`);
      console.log(`   Public URL: ${publicUrl}/${testKey}`);

      // 파일 목록 확인
      const listCommand = new ListObjectsV2Command({
        Bucket: name,
        MaxKeys: 5,
      });
      const listResult = await s3Client.send(listCommand);
      console.log(`   Total objects: ${listResult.KeyCount || 0}`);

      return;
    } catch (error: any) {
      console.log(`   ❌ ${error.Code || error.message}`);
    }
  }

  console.log('\n❌ None of the bucket names worked. Please check bucket name in R2 dashboard.');
}

testR2Simple();
