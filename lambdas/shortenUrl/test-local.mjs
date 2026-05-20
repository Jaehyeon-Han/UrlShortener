// 실제 AWS DynamoDB에 연결하는 로컬 테스트 스크립트
// 실행 전 AWS credentials 설정 필요 (aws configure 또는 환경변수)

// 실행
// set AWS_PROFILE=url-shortener-dev
// set AWS_REGION=ap-northeast-2
// node test-local.mjs

process.env.AWS_REGION = 'us-east-1';
process.env.BASE_URL = 'https://short.example.com';
process.env.TABLE_NAME = 'UrlMapping'; // 실제 DynamoDB 테이블 이름으로 변경
process.env.CODE_LENGTH = '5';

const { handler } = await import('./index.mjs');

async function run(label, event) {
  console.log(`\n--- ${label} ---`);
  const result = await handler(event);
  console.log('statusCode:', result.statusCode);
  console.log('body:', result.body);
}

await run('정상 요청', {
  body: JSON.stringify({ url: 'https://www.test.com' })
});

await run('동일 URL 재요청 (중복 처리)', {
  body: JSON.stringify({ url: 'https://www.test.com' })
});

await run('url 파라미터 누락', {
  body: JSON.stringify({})
});

await run('body가 null인 경우', {
  body: null
});

