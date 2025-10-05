import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// .env 파일 로드
dotenv.config({ path: resolve(__dirname, '../.env') });

async function testR2Connection() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  console.log('🔍 R2 Configuration:');
  console.log(`  - Account ID: ${accountId}`);
  console.log(`  - Bucket Name: ${bucketName}`);
  console.log(`  - Public URL: ${publicUrl}`);
  console.log(`  - Access Key: ${accessKeyId?.substring(0, 10)}...`);

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error('❌ Missing R2 configuration. Please check .env file.');
    process.exit(1);
  }

  // R2 클라이언트 초기화
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  try {
    // 텍스트 파일 업로드 테스트 (HeadBucket 스킵)
    console.log('\n📤 Uploading test file...');
    const testContent = `R2 Connection Test
===================
Timestamp: ${new Date().toISOString()}
Test Status: SUCCESS

This is a test file uploaded to verify R2 bucket connectivity.
`;

    const testKey = `test/connection-test-${Date.now()}.txt`;
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: Buffer.from(testContent, 'utf-8'),
      ContentType: 'text/plain',
    });

    await s3Client.send(putCommand);
    console.log(`✅ File uploaded successfully!`);
    console.log(`   Key: ${testKey}`);
    console.log(`   URL: ${publicUrl}/${testKey}`);

    console.log('\n🎉 R2 connection test completed successfully!');
  } catch (error: any) {
    console.error('\n❌ R2 connection test failed:');
    console.error(`Error: ${error.message || error}`);
    if (error.$metadata) {
      console.error(`HTTP Status: ${error.$metadata.httpStatusCode}`);
    }
    if (error.Code) {
      console.error(`Error Code: ${error.Code}`);
    }
    process.exit(1);
  }
}

testR2Connection();
