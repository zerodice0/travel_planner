import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// .env 파일 로드
dotenv.config({ path: resolve(__dirname, '../.env') });

async function listR2Buckets() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  console.log('🔍 R2 Configuration:');
  console.log(`  - Account ID: ${accountId}`);
  console.log(`  - Access Key: ${accessKeyId?.substring(0, 10)}...`);

  if (!accountId || !accessKeyId || !secretAccessKey) {
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
    console.log('\n📦 Listing all R2 buckets...\n');

    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    if (!response.Buckets || response.Buckets.length === 0) {
      console.log('⚠️  No buckets found in this account.');
      return;
    }

    console.log(`✅ Found ${response.Buckets.length} bucket(s):\n`);
    response.Buckets.forEach((bucket, index) => {
      console.log(`${index + 1}. ${bucket.Name}`);
      console.log(`   Created: ${bucket.CreationDate?.toISOString()}`);
      console.log('');
    });
  } catch (error: any) {
    console.error('\n❌ Failed to list buckets:');
    console.error(`Error: ${error.message || error}`);
    if (error.$metadata) {
      console.error(`HTTP Status: ${error.$metadata.httpStatusCode}`);
    }
    process.exit(1);
  }
}

listR2Buckets();
